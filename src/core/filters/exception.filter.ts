import { Catch } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { CatchService } from "core/catch/catch.service";

@Catch()
export class ExceptionFilter extends BaseExceptionFilter {
  constructor(private readonly catchService: CatchService) {
    super();
  }
  catch(exception: unknown) {
    return this.catchService.catch(exception);
  }
}
