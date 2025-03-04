import { PinataSDK } from "pinata-web3";
require("dotenv").config();

export const pinata = new PinataSDK({
	pinataJwt: `${process.env.REACT_APP_PINATA_JWT}`,
	pinataGateway: `${process.env.REACT_APP_PINATA_GATEWAY}`
});