const fs = require('fs');
const p = 'C:\\Users\\User\\Desktop\\Imp Project\\Rovor\\chatbot\\src\\routeTree.gen.ts';
let c = fs.readFileSync(p, 'utf8');

// Add to FileRoutesByTo
const old1 = "  '/admin/autoFlowScan': typeof AdminAutoFlowScanRoute,\n  '/admin/chatbots': typeof AdminChatbotsRoute,\n  '/admin/coupons': typeof AdminCouponsRoute,\n";
const new1 = "  '/admin/autoFlowScan': typeof AdminAutoFlowScanRoute,\n  '/admin/scan-status/$botId': typeof AdminScanStatusBotIdRoute,\n  '/admin/chatbots': typeof AdminChatbotsRoute,\n  '/admin/coupons': typeof AdminCouponsRoute,\n";
c = c.replace(old1, new1);

// Add to FileRoutesById
const old2 = "  '/admin/autoFlowScan': typeof AdminAutoFlowScanRoute,\n  '/admin/chatbots': typeof AdminChatbotsRoute,\n  '/admin/coupons': typeof AdminCouponsRoute,\n";
const new2 = "  '/admin/autoFlowScan': typeof AdminAutoFlowScanRoute,\n  '/admin/scan-status/$botId': typeof AdminScanStatusBotIdRoute,\n  '/admin/chatbots': typeof AdminChatbotsRoute,\n  '/admin/coupons': typeof AdminCouponsRoute,\n";
c = c.replace(old2, new2);

// Add to RootRouteChildren - insert AdminScanStatusBotIdRoute after AdminAutoFlowScanRoute
const old3 = "  AdminAutoFlowScanRoute: AdminAutoFlowScanRoute,\n  AdminChatbotsRoute: AdminChatbotsRoute,\n";
const new3 = "  AdminAutoFlowScanRoute: AdminAutoFlowScanRoute,\n  AdminScanStatusBotIdRoute: AdminScanStatusBotIdRoute,\n  AdminChatbotsRoute: AdminChatbotsRoute,\n";
c = c.replace(old3, new3);

// Add to AdminRouteChildren interface
const old4 = "  AdminAutoFlowScanRoute: typeof AdminAutoFlowScanRoute,\n  AdminChatbotsRoute: typeof AdminChatbotsRoute,\n";
const new4 = "  AdminAutoFlowScanRoute: typeof AdminAutoFlowScanRoute,\n  AdminScanStatusBotIdRoute: typeof AdminScanStatusBotIdRoute,\n  AdminChatbotsRoute: typeof AdminChatbotsRoute,\n";
c = c.replace(old4, new4);

// Add to fileRoutesByFullPath and to - add the route
const old5 = "  '/admin/autoFlowScan': typeof AdminAutoFlowScanRoute,\n  '/admin/chatbots': typeof AdminChatbotsRoute,\n  '/admin/coupons': typeof AdminCouponsRoute,\n";
const new5 = "  '/admin/autoFlowScan': typeof AdminAutoFlowScanRoute,\n  '/admin/scan-status/$botId': typeof AdminScanStatusBotIdRoute,\n  '/admin/chatbots': typeof AdminChatbotsRoute,\n  '/admin/coupons': typeof AdminCouponsRoute,\n";
c = c.replace(old5, new5);

// Add to fullPaths
const old6 = "    | '/admin/autoFlowScan'\n    | '/admin/chatbots'\n";
const new6 = "    | '/admin/autoFlowScan'\n    | '/admin/scan-status/$botId'\n    | '/admin/chatbots'\n";
c = c.replace(old6, new6);

// Add to to
const old7 = "    | '/admin/autoFlowScan'\n    | '/admin/chatbots'\n";
const new7 = "    | '/admin/autoFlowScan'\n    | '/admin/scan-status/$botId'\n    | '/admin/chatbots'\n";
c = c.replace(old7, new7);

// Add to id
const old8 = "    | '/admin/autoFlowScan'\n    | '/admin/chatbots'\n";
const new8 = "    | '/admin/autoFlowScan'\n    | '/admin/scan-status/$botId'\n    | '/admin/chatbots'\n";
c = c.replace(old8, new8);

// Add to fileRoutesById
const old9 = "    '/admin/autoFlowScan': typeof AdminAutoFlowScanRoute,\n    '/admin/chatbots': typeof AdminChatbotsRoute,\n";
const new9 = "    '/admin/autoFlowScan': typeof AdminAutoFlowScanRoute,\n    '/admin/scan-status/$botId': typeof AdminScanStatusBotIdRoute,\n    '/admin/chatbots': typeof AdminChatbotsRoute,\n";
c = c.replace(old9, new9);

// Add to fileRoutesByFullPath in FileRouteTypes
const old10 = "    '/admin/autoFlowScan': {\n      id: '/admin/autoFlowScan'\n";
if (!c.includes("'/admin/scan-status/$botId': {")) {
  // Add the full route type definition
  const oldRouteType = "    '/admin/autoFlowScan': {\n      id: '/admin/autoFlowScan'\n      path: '/autoFlowScan'\n";
  const newRouteType = "    '/admin/autoFlowScan': {\n      id: '/admin/autoFlowScan'\n      path: '/autoFlowScan'\n";
  // This is complex, let's just add it in FileRouteTypes
}

// Add the full route type definition to FileRouteTypes
const old11 = "    '/admin/autoFlowScan': {\n      id: '/admin/autoFlowScan'\n";
const new11 = "    '/admin/autoFlowScan': {\n      id: '/admin/autoFlowScan'\n";
// Actually the route type is already there for autoFlowScan, we just need to add it

// Add route type
const old12 = "    '/admin/autoFlowScan': {\n      id: '/admin/autoFlowScan'\n      path: '/autoFlowScan'\n      fullPath: '/admin/autoFlowScan'\n      preLoaderRoute: typeof AdminAutoFlowScanRouteImport\n      parentRoute: typeof AdminRoute\n    }\n";
const new12 = "    '/admin/autoFlowScan': {\n      id: '/admin/autoFlowScan'\n      path: '/autoFlowScan'\n      fullPath: '/admin/autoFlowScan'\n      preLoaderRoute: typeof AdminAutoFlowScanRouteImport\n      parentRoute: typeof AdminRoute\n    }\n    '/admin/scan-status/$botId': {\n      id: '/scan-status/$botId'\n      path: '/scan-status/$botId'\n      fullPath: '/admin/scan-status/$botId'\n      preLoaderRoute: typeof AdminScanStatusBotIdRouteImport\n      parentRoute: typeof AdminRoute\n    }\n";
c = c.replace(old12, new12);

fs.writeFileSync(p, c);
console.log('done - remaining updates applied');
console.log('scan-status count:', (c.match(/scan-status/g)||[]).length);
