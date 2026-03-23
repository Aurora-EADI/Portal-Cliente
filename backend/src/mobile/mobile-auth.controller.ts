import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { MobileAuthService } from "./mobile-auth.service";
import { MobileJwtGuard } from "./guards/mobile-jwt.guard";
import { MobileLoginDto } from "./dto/mobile-login.dto";

@ApiTags("mobile-auth")
@Controller("mobile/auth")
export class MobileAuthController {
  constructor(private authService: MobileAuthService) {}

  @Post("login")
  login(@Body() dto: MobileLoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth()
  @Get("me")
  me(@Req() req: any) {
    return req.user;
  }
}
