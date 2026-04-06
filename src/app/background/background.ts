import { listenRPC } from "@lib/rpc";
import { allHandlers } from "@lib/rpc/handlers";

listenRPC(allHandlers);
