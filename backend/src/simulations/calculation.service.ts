import { Injectable, BadRequestException } from "@nestjs/common";
import { ServiceCalculationType } from "@prisma/client-postgres";

/**
 * CalculationService
 *
 * Serviço responsável por calcular o custo final de serviços baseado no tipo de cálculo.
 * Cada tipo de cálculo tem uma fórmula específica e dados obrigatórios.
 */
@Injectable()
export class CalculationService {
  /**
   * Calcula o custo final de um serviço baseado no tipo de cálculo
   *
   * @param calculationType - Tipo de cálculo (FIXED, PERCENTAGE_CIF, PER_CONTAINER, PER_TONNE)
   * @param rate - Taxa base do serviço (ex: 500 para fixo, 0.35 para percentual, 350 para por unidade)
   * @param simulationData - Dados da simulação necessários para o cálculo
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
          `Tipo de cálculo não suportado: ${calculationType}`,
        );
    }
  }

  /**
   * FIXED: Valor fixo
   * Fórmula: rate
   * Exemplo: R$ 500,00 fixo
   */
  private calculateFixed(rate: number): number {
    if (!rate || rate <= 0) {
      throw new BadRequestException("Taxa deve ser maior que zero");
    }
    return rate;
  }

  /**
   * PERCENTAGE_CIF: Percentual sobre o CIF BRL
   * Fórmula: (rate / 100) * cifBrl
   * Exemplo: 0.35% de R$ 100.000 = (0.35/100) × 100.000 = R$ 350
   */
  private calculatePercentageCif(rate: number, cifBrl?: number): number {
    if (!rate || rate <= 0) {
      throw new BadRequestException("Taxa percentual deve ser maior que zero");
    }

    if (cifBrl === undefined || cifBrl === null) {
      throw new BadRequestException(
        "CIF BRL é obrigatório para cálculo percentual",
      );
    }

    if (cifBrl <= 0) {
      throw new BadRequestException("CIF BRL deve ser maior que zero");
    }

    // rate já vem como 0.35 (para 0.35%)
    // Fórmula: (rate / 100) * cifBrl
    return (rate / 100) * cifBrl;
  }

  /**
   * PER_CONTAINER: Valor por container
   * Fórmula: rate * cntrCount
   * Exemplo: R$ 350 × 5 containers = R$ 1.750
   */
  private calculatePerContainer(rate: number, cntrCount?: number): number {
    if (!rate || rate <= 0) {
      throw new BadRequestException(
        "Taxa por container deve ser maior que zero",
      );
    }

    if (cntrCount === undefined || cntrCount === null) {
      throw new BadRequestException(
        "Quantidade de containers é obrigatória para este tipo de cálculo",
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
   * Fórmula: rate * tonnes
   * Exemplo: R$ 25 × 20 toneladas = R$ 500
   */
  private calculatePerTonne(rate: number, tonnes?: number): number {
    if (!rate || rate <= 0) {
      throw new BadRequestException(
        "Taxa por tonelada deve ser maior que zero",
      );
    }

    if (tonnes === undefined || tonnes === null) {
      throw new BadRequestException(
        "Toneladas é obrigatório para este tipo de cálculo",
      );
    }

    if (tonnes <= 0) {
      throw new BadRequestException("Toneladas deve ser maior que zero");
    }

    // Excel style: ROUNDUP(val; -3) / 1000 -> Math.ceil(val / 1000)
    return rate * Math.ceil(tonnes / 1000);
  }

  /**
   * Gera a expressão da fórmula para exibição
   *
   * @param calculationType - Tipo de cálculo
   * @param rate - Taxa base
   * @returns String formatada da fórmula
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
        return "Fórmula não definida";
    }
  }

  /**
   * Valida se os dados da simulação são suficientes para o tipo de cálculo
   *
   * @param calculationType - Tipo de cálculo
   * @param simulationData - Dados da simulação
   * @returns true se válido, lança exceção se inválido
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
        return true; // Não precisa de dados adicionais

      case ServiceCalculationType.PERCENTAGE_CIF:
        if (!simulationData.cifBrl || simulationData.cifBrl <= 0) {
          throw new BadRequestException(
            "CIF BRL válido é obrigatório para serviços com cálculo percentual",
          );
        }
        return true;

      case ServiceCalculationType.PER_CONTAINER:
        if (!simulationData.cntrCount || simulationData.cntrCount <= 0) {
          throw new BadRequestException(
            "Quantidade de containers válida é obrigatória para este serviço",
          );
        }
        return true;

      case ServiceCalculationType.PER_TONNE:
        if (!simulationData.tonnes || simulationData.tonnes <= 0) {
          throw new BadRequestException(
            "Toneladas válidas são obrigatórias para este serviço",
          );
        }
        return true;

      default:
        throw new BadRequestException(
          `Tipo de cálculo não suportado: ${calculationType}`,
        );
    }
  }
}
