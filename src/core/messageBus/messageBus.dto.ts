export class MessageDto<Body, Type extends string> {
  constructor(
    public readonly id: string,
    public readonly type: Type,
    public readonly body: Body,
  ) {}
}
