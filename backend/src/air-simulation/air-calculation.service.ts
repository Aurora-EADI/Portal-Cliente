import { Injectable, BadRequestException } from "@nestjs/common";
import { AirServiceCalculationType } from "@prisma/client";

/**
 * AirCalculationService
 *
 * ServiÃ§o responsÃ¡vel por calcular o custo final de serviÃ§os aÃ©reos baseado no tipo de cÃ¡lculo.
 * Cada tipo de cÃ¡lculo tem uma fÃ³rmula especÃ­fica e dados obrigatÃ³rios.
 */
@Injectable()
export class AirCalculationService {
  /**
   * Calcula o custo final de um serviÃ§o aÃ©reo baseado no tipo de cÃ¡lculo
   *
   * @param calculationType - Tipo de cÃ¡lculo (FIXED, PERCENTAGE_CIF, PER_KG)
   * @param rate - Taxa base do serviÃ§o (ex: 500 para fixo, 0.35 para percentual, 2.50 para por kg)
   * @param simulationData - Dados da simulaÃ§Ã£o necessÃ¡rios para o cÃ¡lculo
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
          `Tipo de cÃ¡lculo nÃ£o suportado: ${calculationType}`,
        );
    }
  }

  /**
   * FIXED: Valor fixo
   * FÃ³rmula: rate
   * Exemplo: R$ 350,00 fixo (tarifa mÃ­nima emissÃ£o NFE)
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
   * Exemplo: 0.35% de R$ 630.000 = (0.35/100) Ã— 630.000 = R$ 2.205
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
   * PER_KG: Valor por quilograma
   * FÃ³rmula: rate * weightKg
   * Exemplo: R$ 2,62 Ã— 430 kg = R$ 1.126,60
   */
  private calculatePerKg(rate: number, weightKg?: number): number {
    if (rate < 0) {
      throw new BadRequestException(
        "Taxa por quilograma deve ser maior ou igual a zero",
      );
    }

    if (weightKg === undefined || weightKg === null) {
      throw new BadRequestException(
        "Peso em KG Ã© obrigatÃ³rio para este tipo de cÃ¡lculo",
      );
    }

    if (weightKg <= 0) {
      throw new BadRequestException("Peso em KG deve ser maior que zero");
    }

    return rate * weightKg;
  }

  /**
   * PER_TONNE: Cobra pelo maior entre toneladas e metros cÃºbicos
   * FÃ³rmula: rate * max(weightKg/1000, volumeM3)
   * Regra 1.1.3: MovimentaÃ§Ã£o de Carga - R$ 2,62 por tonelada;
   * quando cubagem for superior ao peso, cobranÃ§a serÃ¡ por mÂ³
   */
  private calculatePerTonneOrM3(
    rate: number,
    weightKg?: number,
    volumeM3?: number,
  ): number {
    if (rate < 0) {
      throw new BadRequestException("Taxa por tonelada/mÂ³ deve ser maior ou igual a zero");
    }

    // O Peso continua sendo obrigatÃ³rio
    if (weightKg === undefined || weightKg === null || weightKg <= 0) {
      throw new BadRequestException("Peso em KG Ã© obrigatÃ³rio e deve ser maior que zero");
    }

    // TRATAMENTO PARA VOLUME OPCIONAL:
    // Se volumeM3 for null, undefined ou 0, usamos 0 para a comparaÃ§Ã£o.
    const vM3 = volumeM3 || 0;

    // Converte peso de KG para toneladas
    const tonnes = weightKg / 1000;

    // Usa o maior entre toneladas e mÂ³. Se mÂ³ for 0, o 'tonnes' sempre vencerÃ¡.
    // Aplicamos Math.ceil para respeitar a regra de "tonelada ou fraÃ§Ã£o"
    const billingUnit = Math.ceil(Math.max(tonnes, vM3));

    return rate * billingUnit;
  }

  /**
   * Calcula o valor da Capatazia
   * Regra: 1,4737 por kg, cobranÃ§a mÃ­nima de 94,11
   */
  calculateCapatazia(weightKg: number): number {
    if (!weightKg || weightKg <= 0) return 0;
    const calculated = weightKg * 1.4737;
    return Math.max(calculated, 94.11);
  }

  /**
   * Gera a expressÃ£o da fÃ³rmula para exibiÃ§Ã£o
   *
   * @param calculationType - Tipo de cÃ¡lculo
   * @param rate - Taxa base
   * @returns String formatada da fÃ³rmula
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
    calculationType: AirServiceCalculationType,
    simulationData: {
      cifBrl?: number;
      weightKg?: number;
      volumeM3?: number;
    },
  ): boolean {
    switch (calculationType) {
      case AirServiceCalculationType.FIXED:
        return true; // NÃ£o precisa de dados adicionais

      case AirServiceCalculationType.PERCENTAGE_CIF:
        if (!simulationData.cifBrl || simulationData.cifBrl <= 0) {
          throw new BadRequestException(
            "CIF BRL vÃ¡lido Ã© obrigatÃ³rio para serviÃ§os com cÃ¡lculo percentual",
          );
        }
        return true;

      case AirServiceCalculationType.PER_KG:
        if (!simulationData.weightKg || simulationData.weightKg <= 0) {
          throw new BadRequestException(
            "Peso em KG vÃ¡lido Ã© obrigatÃ³rio para este serviÃ§o",
          );
        }
        return true;

      case AirServiceCalculationType.PER_TONNE:
        if (!simulationData.weightKg || simulationData.weightKg <= 0) {
          throw new BadRequestException(
            "Peso em KG vÃ¡lido Ã© obrigatÃ³rio para movimentaÃ§Ã£o de carga",
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

