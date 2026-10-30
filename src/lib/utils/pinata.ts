import "server-only";

import { PinataSDK } from "pinata";

const pinataJwt = process.env.PINATA_JWT ?? process.env.JWT;
const pinataGateway =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.PINATA_GATEWAY_URL;

export const pinata = new PinataSDK({
  pinataJwt,
  pinataGateway,
});
