import { UsePipes } from "@nestjs/common";
import { HexFormattingPipe } from "core/pipes/hexFormatting.pipe";
import { AdminService } from "./admin.service";
import { RpcService, RpcMethod } from "core/rpc";

@UsePipes(HexFormattingPipe)
@RpcService("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * @description Get node public address
   */
  @RpcMethod()
  address() {
    return this.adminService.address;
  }
}
