import { getGraphQLParameters, processRequest, renderGraphiQL, shouldRenderGraphiQL } from "graphql-helix"
import type { RouteHandler } from "fastify"
import type { GraphQLSchema } from "graphql"

export function createGraphqlRouteHandler(schema: GraphQLSchema): RouteHandler {
    return async (req, res) => {
        const request = {
            body: req.body,
            headers: req.headers,
            method: req.method,
            query: req.query,
        };

        if (shouldRenderGraphiQL(request)) {
            res.type("text/html");
            res.send(renderGraphiQL({}));
        } else {
            const { operationName, query, variables } = getGraphQLParameters(request);
            const result = await processRequest({
                operationName,
                query,
                variables,
                request,
                schema,
            });

            if (result.type === "RESPONSE") {
                result.headers.forEach(({ name, value }) => res.header(name, value));
                res.status(result.status);
                res.send(result.payload);
            } else if (result.type === "PUSH") {
                res.raw.writeHead(200, {
                    "Content-Type": "text/event-stream",
                    Connection: "keep-alive",
                    "Cache-Control": "no-cache",
                });

                req.raw.on("close", () => {
                    result.unsubscribe();
                });

                await result.subscribe((result) => {
                    res.raw.write(`data: ${JSON.stringify(result)}\n\n`);
                });
            } else {
                res.raw.writeHead(200, {
                    Connection: "keep-alive",
                    "Content-Type": 'multipart/mixed; boundary="-"',
                    "Transfer-Encoding": "chunked",
                });

                req.raw.on("close", () => {
                    result.unsubscribe();
                });

                res.raw.write("---");

                await result.subscribe((result) => {
                    const chunk = Buffer.from(JSON.stringify(result), "utf8");
                    const data = [
                        "",
                        "Content-Type: application/json; charset=utf-8",
                        "Content-Length: " + String(chunk.length),
                        "",
                        chunk,
                    ];

                    if (result.hasNext) {
                        data.push("---");
                    }

                    res.raw.write(data.join("\r\n"));
                });

                res.raw.write("\r\n-----\r\n");
                res.raw.end();
            }
        }
    }
}
