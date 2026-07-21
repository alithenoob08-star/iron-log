import { createSerwistRoute } from "@serwist/turbopack";

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [
      { url: "/offline", revision: String(Date.now()) },
    ],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
