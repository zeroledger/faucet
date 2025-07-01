import { UsePipes } from "@nestjs/common";
import { HexFormattingPipe } from "core/pipes/hexFormatting.pipe";
import { MainService } from "./main.service";
import { RpcService, RpcMethod } from "core/rpc";
import { ZodRpcParamsValidationPipe } from "core/pipes/zod.pipe";
import {
  CollaborativeRedemptionDto,
  CollaborativeRedemptionDtoSchema,
  DelegatedDepositDto,
  DelegatedDepositDtoSchema,
  ForfeitRequestDto,
  ForfeitRequestDtoSchema,
  NewNoteRequestDto,
  NewNoteRequestDtoSchema,
  SpendingRequestDto,
  SpendingRequestDtoSchema,
} from "./main.dto";
import { DepositsService } from "./deposits.service";

@UsePipes(HexFormattingPipe)
@RpcService("main")
export class MainController {
  constructor(
    private readonly mainService: MainService,
    private readonly depositsService: DepositsService,
  ) {}

  /**
   * @description Initiate deposit to service
   */
  @UsePipes(new ZodRpcParamsValidationPipe(NewNoteRequestDtoSchema))
  @RpcMethod()
  requestDeposit(params: NewNoteRequestDto) {
    return this.mainService.createNewNotes(params);
  }

  /**
   * @description Confirm deposit and obtain secret
   */
  @UsePipes(new ZodRpcParamsValidationPipe(DelegatedDepositDtoSchema))
  @RpcMethod()
  deposit(params: DelegatedDepositDto) {
    return this.depositsService.deposit(params);
  }

  /**
   * @description Request to create new notes in exchange for existing notes
   */
  @UsePipes(new ZodRpcParamsValidationPipe(SpendingRequestDtoSchema))
  @RpcMethod()
  requestSpend(params: SpendingRequestDto) {
    return this.mainService.requestSpend(params);
  }

  /**
   * @description Forfeit notes in exchange for newly committed notes
   */
  @UsePipes(new ZodRpcParamsValidationPipe(ForfeitRequestDtoSchema))
  @RpcMethod()
  forfeit(params: ForfeitRequestDto) {
    return this.mainService.applyForfeit(params);
  }

  /**
   * @description Redeem note
   */
  @UsePipes(new ZodRpcParamsValidationPipe(CollaborativeRedemptionDtoSchema))
  @RpcMethod()
  collaborativeRedemption(params: CollaborativeRedemptionDto) {
    return this.mainService.collaborativeRedemption(params);
  }
}
