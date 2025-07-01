import { PipeTransform, Injectable } from "@nestjs/common";
import { format } from "core/utils";

@Injectable()
export class HexFormattingPipe implements PipeTransform {
  transform(value: unknown) {
    return format(value);
  }
}
