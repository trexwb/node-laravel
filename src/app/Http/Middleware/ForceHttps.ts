export const forceHttps = (req: any, res: any, next: any) => {
  if (!req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
};