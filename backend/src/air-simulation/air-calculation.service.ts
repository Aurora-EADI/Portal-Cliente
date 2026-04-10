import { Injectable, BadRequestException } from "@nestjs/common";
import { AirServiceCalculationType } from "@prisma/client";

/**
 * AirCalculationService
 *
 * Serviço responsável por calcular o custo final de serviços aéreos baseado no tipo de cálculo.
 * Cada tipo de cálculo tem uma fórmula específica e dados obrigatórios.
 */
@Injectable()
export class AirCalculationService {
  /**
   * Calcula o custo final de um serviço aéreo baseado no tipo de cálculo
   *
   * @param calculationType - Tipo de cálculo (FIXED, PERCENTAGE_CIF, PER_KG)
   * @param rate - Taxa base do serviço (ex: 500 para fixo, 0.35 para percentual, 2.50 para por kg)
   * @param simulationData - Dados da simulação necessários para o cálculo
   * @returns Valor final calculado
   */
  calculateServiceCost(
    calculationType: AirServiceCalculationType,
    rate: number,
    simulationData: {
      cifBrl?: number;
      weightKg?: number;
      volumeM3?: number;
    },
  ): number {
    switch (calculationType) {
      case AirServiceCalculationType.FIXED:
        return this.calculateFixed(rate);

      case AirServiceCalculationType.PERCENTAGE_CIF:
        return this.calculatePercentageCif(rate, simulationData.cifBrl);

      case AirServiceCalculationType.PER_KG:
        return this.calculatePerKg(rate, simulationData.weightKg);

      case AirServiceCalculationType.PER_TONNE:
        return this.calculatePerTonneOrM3(
          rate,
          simulationData.weightKg,
          simulationData.volumeM3,
        );

      default:
        throw new BadRequestException(
          `Tipo de cálculo não suportado: ${calculationType}`,
        );
    }
  }

  /**
   * FIXED: Valor fixo
   * Fórmula: rate
   * Exemplo: R$ 350,00 fixo (tarifa mínima emissão NFE)
   */
  private calculateFixed(rate: number): number {
    if (rate < 0) {
      throw new BadRequestException("Taxa deve ser maior ou igual a zero");
    }
    return rate;
  }

  /**
   * PERCENTAGE_CIF: Percentual sobre o CIF BRL
   * Fórmula: (rate / 100) * cifBrl
   * Exemplo: 0.35% de R$ 630.000 = (0.35/100) × 630.000 = R$ 2.205
   */
  private calculatePercentageCif(rate: number, cifBrl?: number): number {
    if (rate < 0) {
      throw new BadRequestException(
        "Taxa percentual deve ser maior ou igual a zero",
      );
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
   * PER_KG: Valor por quilograma
   * Fórmula: rate * weightKg
   * Exemplo: R$ 2,62 × 430 kg = R$ 1.126,60
   */
  private calculatePerKg(rate: number, weightKg?: number): number {
    if (rate < 0) {
      throw new BadRequestException(
        "Taxa por quilograma deve ser maior ou igual a zero",
      );
    }

    if (weightKg === undefined || weightKg === null) {
      throw new BadRequestException(
        "Peso em KG é obrigatório para este tipo de cálculo",
      );
    }

    if (weightKg <= 0) {
      throw new BadRequestException("Peso em KG deve ser maior que zero");
    }

    return rate * weightKg;
  }

  /**
   * PER_TONNE: Cobra pelo maior entre toneladas e metros cúbicos
   * Fórmula: rate * max(weightKg/1000, volumeM3)
   * Regra 1.1.3: Movimentação de Carga - R$ 2,62 por tonelada;
   * quando cubagem for superior ao peso, cobrança será por mÂ³
   */
  private calculatePerTonneOrM3(
    rate: number,
    weightKg?: number,
    volumeM3?: number,
  ): number {
    if (rate < 0) {
      throw new BadRequestException(
        "Taxa por tonelada/mÂ³ deve ser maior ou igual a zero",
      );
    }

    // O Peso continua sendo obrigatório
    if (weightKg === undefined || weightKg === null || weightKg <= 0) {
      throw new BadRequestException(
        "Peso em KG é obrigatório e deve ser maior que zero",
      );
    }

    // TRATAMENTO PARA VOLUME OPCIONAL:
    // Se volumeM3 for null, undefined ou 0, usamos 0 para a comparação.
    const vM3 = volumeM3 || 0;

    // Converte peso de KG para toneladas
    const tonnes = weightKg / 1000;

    // Usa o maior entre toneladas e mÂ³. Se mÂ³ for 0, o 'tonnes' sempre vencerá.
    // Aplicamos Math.ceil para respeitar a regra de "tonelada ou fração"
    const billingUnit = Math.ceil(Math.max(tonnes, vM3));

    return rate * billingUnit;
  }

  /**
   * Calcula o valor da Capatazia
   * Regra: 1,4737 por kg, cobrança mínima de 94,11
   */
  calculateCapatazia(weightKg: number): number {
    if (!weightKg || weightKg <= 0) return 0;
    const calculated = weightKg * 1.4737;
    return Math.max(calculated, 94.11);
  }

  /**
   * Gera a expressão da fórmula para exibição
   *
   * @param calculationType - Tipo de cálculo
   * @param rate - Taxa base
   * @returns String formatada da fórmula
   */
  getFormulaExpression(
    calculationType: AirServiceCalculationType,
    rate: number,
  ): string {
    switch (calculationType) {
      case AirServiceCalculationType.FIXED:
        return `R$ ${rate.toFixed(2).replace(".", ",")} fixo`;

      case AirServiceCalculationType.PERCENTAGE_CIF:
        return `${rate}% do CIF`;

      case AirServiceCalculationType.PER_KG:
        return `R$ ${rate.toFixed(2).replace(".", ",")} por KG`;

      case AirServiceCalculationType.PER_TONNE:
        return `R$ ${rate.toFixed(2).replace(".", ",")} por ton/mÂ³ (maior)`;

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
    calculationType: AirServiceCalculationType,
    simulationData: {
      cifBrl?: number;
      weightKg?: number;
      volumeM3?: number;
    },
  ): boolean {
    switch (calculationType) {
      case AirServiceCalculationType.FIXED:
        return true; // Não precisa de dados adicionais

      case AirServiceCalculationType.PERCENTAGE_CIF:
        if (!simulationData.cifBrl || simulationData.cifBrl <= 0) {
          throw new BadRequestException(
            "CIF BRL válido é obrigatório para serviços com cálculo percentual",
          );
        }
        return true;

      case AirServiceCalculationType.PER_KG:
        if (!simulationData.weightKg || simulationData.weightKg <= 0) {
          throw new BadRequestException(
            "Peso em KG válido é obrigatório para este serviço",
          );
        }
        return true;

      case AirServiceCalculationType.PER_TONNE:
        if (!simulationData.weightKg || simulationData.weightKg <= 0) {
          throw new BadRequestException(
            "Peso em KG válido é obrigatório para movimentação de carga",
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
