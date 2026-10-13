# Deployment to Hostinger

This project uses TanStack Start with server-side rendering. Uploading its source
files to a PHP-only document root does not run the website.

## Build

Run these commands in the repository directory on the server:

```sh
npm install
RAYON_NUM_THREADS=1 npm run build
```

The production build uses Nitro's `node-server` preset. Its startup file is
`.output/server/index.mjs`.

## Run on the hosting account

The hosting plan must provide a persistent Node.js application runtime. In
Hostinger hPanel, create a Node.js app for the subdomain, set its application
root to this repository, and use `.output/server/index.mjs` as the startup
file. Use the Node.js version and port assigned by hPanel, then restart the app.
The subdomain must be mapped to that Node.js app; leaving it pointed at the
default PHP document root will continue to show Hostinger's default page.

If the plan has no Node.js app feature, SSH alone cannot configure the web
server's domain routing or keep a process supervised. Ask Hostinger whether the
plan supports Node.js apps and domain routing; otherwise use a plan that does,
such as a VPS.
