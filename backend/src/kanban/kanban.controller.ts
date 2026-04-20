import { Controller, Get, Query } from "@nestjs/common";
import { KanbanService } from "./kanban.service";

@Controller("kanban")
export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  @Get()
  async findAll(
    @Query("dtInicio") dtInicio?: string,
    @Query("dtFinal") dtFinal?: string,
    @Query("flagTipo") flagTipo?: string,
    @Query("codTransp") codTransp?: string,
  ) {
    return this.kanbanService.findAll(
      dtInicio ? new Date(dtInicio) : undefined,
      dtFinal ? new Date(dtFinal) : undefined,
      flagTipo ? Number(flagTipo) : undefined,
      codTransp ? Number(codTransp) : undefined,
    );
  }
}
