import { Injectable, BadRequestException } from "@nestjs/common";
import { ServiceCalculationType } from "@prisma/client";

/**
 * CalculationService
 *
 * ServiÃ§o responsÃ¡vel por calcular o custo final de serviÃ§os baseado no tipo de cÃ¡lculo.
 * Cada tipo de cÃ¡lculo tem uma fÃ³rmula especÃ­fica e dados obrigatÃ³rios.
 */
@Injectable()
export class CalculationService {
  /**
   * Calcula o custo final de um serviÃ§o baseado no tipo de cÃ¡lculo
   *
   * @param calculationType - Tipo de cÃ¡lculo (FIXED, PERCENTAGE_CIF, PER_CONTAINER, PER_TONNE)
   * @param rate - Taxa base do serviÃ§o (ex: 500 para fixo, 0.35 para percentual, 350 para por unidade)
   * @param simulationData - Dados da simulaÃ§Ã£o necessÃ¡rios para o cÃ¡lculo
   * @returns Valor final calculado
   */
  calculateServiceCost(
    calculationType: ServiceCalculationType,
    rate: number,
    simulationData: {
      cifBrl?: number;
      cntrCount?: number;
      tonnes?: number;
    },
  ): number {
    switch (calculationType) {
      case ServiceCalculationType.FIXED:
        return this.calculateFixed(rate);

      case ServiceCalculationType.PERCENTAGE_CIF:
        return this.calculatePercentageCif(rate, simulationData.cifBrl);

      case ServiceCalculationType.PER_CONTAINER:
        return this.calculatePerContainer(rate, simulationData.cntrCount);

      case ServiceCalculationType.PER_TONNE:
        return this.calculatePerTonne(rate, simulationData.tonnes);

      default:
        throw new BadRequestException(
          `Tipo de cÃ¡lculo nÃ£o suportado: ${calculationType}`,
        );
    }
  }

  /**
   * FIXED: Valor fixo
   * FÃ³rmula: rate
   * Exemplo: R$ 500,00 fixo
   */
  private calculateFixed(rate: number): number {
    if (rate < 0) {
      throw new BadRequestException("Taxa deve ser maior ou igual a zero");
    }
    return rate;
  }

  /**
   * PERCENTAGE_CIF: Percentual sobre o CIF BRL
   * FÃ³rmula: (rate / 100) * cifBrl
   * Exemplo: 0.35% de R$ 100.000 = (0.35/100) Ã— 100.000 = R$ 350
   */
  private calculatePercentageCif(rate: number, cifBrl?: number): number {
    if (rate < 0) {
      throw new BadRequestException("Taxa percentual deve ser maior ou igual a zero");
    }

    if (cifBrl === undefined || cifBrl === null) {
      throw new BadRequestException(
        "CIF BRL Ã© obrigatÃ³rio para cÃ¡lculo percentual",
      );
    }

    if (cifBrl <= 0) {
      throw new BadRequestException("CIF BRL deve ser maior que zero");
    }

    // rate jÃ¡ vem como 0.35 (para 0.35%)
    // FÃ³rmula: (rate / 100) * cifBrl
    return (rate / 100) * cifBrl;
  }

  /**
   * PER_CONTAINER: Valor por container
   * FÃ³rmula: rate * cntrCount
   * Exemplo: R$ 350 Ã— 5 containers = R$ 1.750
   */
  private calculatePerContainer(rate: number, cntrCount?: number): number {
    if (rate < 0) {
      throw new BadRequestException(
        "Taxa por container deve ser maior ou igual a zero",
      );
    }

    if (cntrCount === undefined || cntrCount === null) {
      throw new BadRequestException(
        "Quantidade de containers Ã© obrigatÃ³ria para este tipo de cÃ¡lculo",
      );
    }

    if (cntrCount <= 0) {
      throw new BadRequestException(
        "Quantidade de containers deve ser maior que zero",
      );
    }

    return rate * cntrCount;
  }

  /**
   * PER_TONNE: Valor por tonelada
   * FÃ³rmula: rate * tonnes
   * Exemplo: R$ 25 Ã— 20 toneladas = R$ 500
   */
  private calculatePerTonne(rate: number, tonnes?: number): number {
    if (rate < 0) {
      throw new BadRequestException(
        "Taxa por tonelada deve ser maior ou igual a zero",
      );
    }

    if (tonnes === undefined || tonnes === null) {
      throw new BadRequestException(
        "Toneladas Ã© obrigatÃ³rio para este tipo de cÃ¡lculo",
      );
    }

    if (tonnes <= 0) {
      throw new BadRequestException("Toneladas deve ser maior que zero");
    }

    // Excel style: ROUNDUP(val; -3) / 1000 -> Math.ceil(val / 1000)
    return rate * Math.ceil(tonnes / 1000);
  }

  /**
   * Gera a expressÃ£o da fÃ³rmula para exibiÃ§Ã£o
   *
   * @param calculationType - Tipo de cÃ¡lculo
   * @param rate - Taxa base
   * @returns String formatada da fÃ³rmula
   */
  getFormulaExpression(
    calculationType: ServiceCalculationType,
    rate: number,
  ): string {
    switch (calculationType) {
      case ServiceCalculationType.FIXED:
        return `R$ ${rate.toFixed(2).replace(".", ",")} fixo`;

      case ServiceCalculationType.PERCENTAGE_CIF:
        return `${rate}% do CIF`;

      case ServiceCalculationType.PER_CONTAINER:
        return `R$ ${rate.toFixed(2).replace(".", ",")} por container`;

      case ServiceCalculationType.PER_TONNE:
        return `R$ ${rate.toFixed(2).replace(".", ",")} por tonelada`;

      default:
        return "FÃ³rmula nÃ£o definida";
    }
  }

  /**
   * Valida se os dados da simulaÃ§Ã£o sÃ£o suficientes para o tipo de cÃ¡lculo
   *
   * @param calculationType - Tipo de cÃ¡lculo
   * @param simulationData - Dados da simulaÃ§Ã£o
   * @returns true se vÃ¡lido, lanÃ§a exceÃ§Ã£o se invÃ¡lido
   */
  validateSimulationData(
    calculationType: ServiceCalculationType,
    simulationData: {
      cifBrl?: number;
      cntrCount?: number;
      tonnes?: number;
    },
  ): boolean {
    switch (calculationType) {
      case ServiceCalculationType.FIXED:
        return true; // NÃ£o precisa de dados adicionais

      case ServiceCalculationType.PERCENTAGE_CIF:
        if (!simulationData.cifBrl || simulationData.cifBrl <= 0) {
          throw new BadRequestException(
            "CIF BRL vÃ¡lido Ã© obrigatÃ³rio para serviÃ§os com cÃ¡lculo percentual",
          );
        }
        return true;

      case ServiceCalculationType.PER_CONTAINER:
        if (!simulationData.cntrCount || simulationData.cntrCount <= 0) {
          throw new BadRequestException(
            "Quantidade de containers vÃ¡lida Ã© obrigatÃ³ria para este serviÃ§o",
          );
        }
        return true;

      case ServiceCalculationType.PER_TONNE:
        if (!simulationData.tonnes || simulationData.tonnes <= 0) {
          throw new BadRequestException(
            "Toneladas vÃ¡lidas sÃ£o obrigatÃ³rias para este serviÃ§o",
          );
        }
        return true;

      default:
        throw new BadRequestException(
          `Tipo de cÃ¡lculo nÃ£o suportado: ${calculationType}`,
        );
    }
  }
}

