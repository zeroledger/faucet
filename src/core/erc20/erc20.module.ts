import { Module } from "@nestjs/common";
import { ERC20Service } from "./erc20.service";

@Module({
  providers: [ERC20Service],
  exports: [ERC20Service],
})
export class Erc20Module {}
