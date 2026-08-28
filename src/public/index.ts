/*
 * @Author: trexwb
 * @Date: 2026-01-29 11:25:15
 * @LastEditors: ${git_name}
 * @LastEditTime: 2026-04-02 10:55:23
 * @FilePath: /stl-dev-server/server/src/public/index.ts
 * @Description:
 * 一花一世界，一叶一如来
 * Copyright (c) 2026 by 杭州大美/trexwb, All Rights Reserved.
 */
import { QueueWorker } from '#app/Console/Commands/QueueWorker'
import { bootstrap, container } from '#bootstrap/app'
import { runWithCluster } from '#bootstrap/cluster'
import '#bootstrap/env'
import { envBoolean } from '#bootstrap/env'
import { bootScheduling } from '#bootstrap/schedule'
import { registerChannels } from '#routes/channels'
import { createLogger } from '#utils/logger'
import { readFileSync } from 'node:fs'
import { createServer as createHttpServer } from 'node:http'
import { createServer as createHttpsServer, Server as HttpsServer } from 'node:https'
import { WebSocketServer } from 'ws'

const log = createLogger('Server')

runWithCluster(async () => {
  const { app, db } = container
  const config = container.config('app')
  await bootstrap(app)

  let wss: WebSocketServer | undefined

  const httpServer = createHttpServer(app)
  const httpPort = config.http_port
  const httpsPort = config.https_port

  let httpsServer: HttpsServer | undefined
  if (config.ssl.enabled) {
    try {
      const options = {
        key: readFileSync(config.ssl.key),
        cert: readFileSync(config.ssl.cert),
      }
      httpsServer = createHttpsServer(options, app)
    } catch (err) {
      log.error({ err }, '[SSL] 证书加载失败，HTTPS 未启动')
    }
  }

  if (config.ws.enabled) {
    try {
      wss = new WebSocketServer({ server: httpsServer || httpServer })
      registerChannels(wss)
    } catch (err) {
      log.error({ err }, '[WSS] WebSocket 未启动')
    }
  }

  httpServer.listen(httpPort, () => {
    log.info(
      { port: httpPort, url: `http://${config.app_url || 'localhost'}:${httpPort}` },
      `[Worker ${process.pid}] 🔓 HTTP Server 已启动`
    )
  })

  if (httpsServer) {
    httpsServer.listen(httpsPort, () => {
      log.info(
        { port: httpsPort, url: `https://${config.app_url || 'localhost'}:${httpsPort}` },
        `[Worker ${process.pid}] 🔒 HTTPS Server 已启动`
      )
    })
  }

  try {
    bootScheduling()
  } catch (err) {
    log.error({ err }, '[schedule] 调度器未启动')
  }

  if (envBoolean('START_QUEUE_WORKER', false)) {
    QueueWorker.run().catch((err: unknown) => {
      log.error({ err }, '[QueueWorker] 队列 Worker 异常退出')
    })
    log.info('[QueueWorker] 队列 Worker 已在同进程内启动')
  }

  async function gracefulShutdown(signal: string) {
    log.info({ signal }, `[Worker ${process.pid}] 收到退出信号，开始优雅关闭`)

    const shutdownTasks: Promise<void>[] = []

    if (wss) {
      shutdownTasks.push(
        new Promise((resolve) => {
          wss?.close((err) => {
            if (err) log.error({ err }, '[WSS] 关闭失败')
            else log.info('[WSS] WebSocket 服务器已关闭')
            resolve()
          })
        })
      )
    }

    shutdownTasks.push(
      new Promise((resolve) => {
        httpServer.close((err) => {
          if (err) log.error({ err }, '[HTTP] 关闭失败')
          else log.info(`[HTTP] Server 已关闭 (端口: ${httpPort})`)
          resolve()
        })
      })
    )

    if (httpsServer) {
      shutdownTasks.push(
        new Promise((resolve) => {
          httpsServer.close((err) => {
            if (err) log.error({ err }, '[HTTPS] 关闭失败')
            else log.info(`[HTTPS] Server 已关闭 (端口: ${httpsPort})`)
            resolve()
          })
        })
      )
    }

    shutdownTasks.push(
      new Promise((resolve) => {
        db.destroy((err: Error | null) => {
          if (err) log.error({ err }, '[Database] 连接关闭失败')
          else log.info('[Database] 连接已关闭')
          resolve()
        })
      })
    )

    await Promise.all(shutdownTasks)

    log.info(`[Worker ${process.pid}] 所有资源已释放，退出进程`)
    process.exit(0)
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
})
