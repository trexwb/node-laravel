import cluster from 'node:cluster';
import os from 'node:os';

export function runWithCluster(boot: () => void) {
  const isClusterEnabled = process.env.CLUSTER_ENABLED === 'true';

  if (isClusterEnabled && cluster.isPrimary) {
    const numCPUs = process.env.CLUSTER_WORKERS === 'auto'
      ? os.cpus().length
      : parseInt(process.env.CLUSTER_WORKERS || '1');

    console.log(`[Master] 🛡️ 系统启动中，正在调度 ${numCPUs} 个工作进程...`);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker) => {
      console.log(`[Master] ⚠️ 工作进程 ${worker.process.pid} 离线，正在自动拉起...`);
      cluster.fork();
    });
  } else {
    // 如果未开启集群或处于子进程，则执行传入的启动回调
    boot();
  }
}