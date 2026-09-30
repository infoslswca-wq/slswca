import type { Instrumentation } from "next";

/** Every uncaught server error (pages, route handlers, proxy) goes through our reporter. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { reportError } = await import("./lib/observability");
  await reportError(err, {
    route: context.routePath,
    type: context.routeType,
    method: request.method,
    path: request.path.split("?")[0], // drop query strings (may carry order ids)
  });
};
