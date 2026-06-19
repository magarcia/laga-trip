// Bus hostel (Elexalde, Ibarrangelu) <-> Playa de Laga durante los días de surf.
//
// Línea: Bizkaibus A3526 (Mungia-Gernika Lumo-Ibarrangelu). La parada del hostel es
// "Elejalde 7" (ID 1894), a ~2 min andando del alojamiento (Elexalde Auzoa 11). La
// parada "Laga" (ID 2394 sentido playa / 2379 sentido vuelta) queda a ~6 min (450 m)
// de la arena. Tarifa 2,00 €.
//
// Secuencia real de paradas (verificada en Bidaide, sentido Ibinaga/Elejalde 7 -> Gernika):
//   Elejalde 7 (1894) -> Durukiz -> Akorda -> Zubibarriaga -> Lastarria -> Laga (2394)
//   -> Anzora -> Gametxo -> Laida -> ... -> Gernika -> Mungia.
// Es decir: 5 paradas / ~8 min de Elejalde 7 a Laga. Puerta a puerta ~16 min.
//
// MATIZ IMPORTANTE sobre el sentido:
// Tanto los buses con destino "Mungia" como los de destino "Gernika" salen de Elejalde 7
// en el mismo sentido físico y pasan por Laga ~8 min después. Los "Gernika" no van en
// dirección contraria: simplemente terminan antes (en Gernika) en vez de seguir a Mungia.
// Para ir a la playa sirven AMBOS. La vuelta (Laga -> hostel) es el sentido contrario
// (A3526 hacia Ibarrangelu/Ibinaga), que pasa por Laga (2379) y deja en el extremo del
// hostel (Ibinaga 2 / Elejalde 12) ~8 min después.
//
// Horarios: SEASONAL y afectados por OBRAS en Gernika (la propia parada avisa de desvíos
// y cambios en junio). Tómalos como orientativos y confirma en vivo antes de salir.
//   Bidaide línea:  https://www.bidaide.eus/es/route/map/Bizkaibus/3526
// Alternativa andando: ~46 min, 3,6 km por la BI-3234.

export interface BusStop {
  /** Nombre oficial de la parada tal y como aparece en Bizkaibus/Bidaide. */
  readonly name: string;
  /** Código de parada Bizkaibus, para localizarla en Bidaide. */
  readonly code: string;
}

export interface BusDirection {
  /** Etiqueta corta de la dirección (p. ej. "A la playa"). */
  readonly label: string;
  /** Parada donde se sube. */
  readonly from: BusStop;
  /** Parada donde se baja. */
  readonly to: BusStop;
  /** Salidas orientativas desde `from` un día de verano (sáb/dom/festivo). */
  readonly departures: readonly string[];
  /** Nota corta sobre el origen/fiabilidad de estas salidas. */
  readonly note: string;
}

export interface BusLagaInfo {
  readonly line: string;
  readonly lineName: string;
  /** Frecuencia aproximada en verano. */
  readonly frequency: string;
  /** Minutos de bus entre las dos paradas (Elejalde 7 <-> Laga). */
  readonly journeyMins: number;
  /** Número de paradas del bus entre Elejalde 7 y Laga. */
  readonly busStops: number;
  /** Minutos andando del hostel a la parada "Elejalde 7". */
  readonly walkToStopMins: number;
  /** Metros andando del hostel a la parada "Elejalde 7". */
  readonly walkToStopM: number;
  /** Minutos andando de la parada "Laga" a la arena. */
  readonly walkToBeachMins: number;
  /** Metros andando de la parada "Laga" a la arena. */
  readonly walkToBeachM: number;
  /** Minutos puerta a puerta (andar + bus + andar). */
  readonly doorToDoorMins: number;
  /** Tarifa del billete en euros. */
  readonly fareEur: number;
  /** Minutos andando hostel -> playa (alternativa a pie completa). */
  readonly walkMins: number;
  /** Distancia andando hostel -> playa. */
  readonly walkKm: number;
  readonly directions: readonly [BusDirection, BusDirection];
  readonly links: {
    /** Horarios de la línea en Bidaide. */
    readonly horarios: string;
    /** Ruta en Google Maps hostel -> Playa de Laga en transporte público. */
    readonly ruta: string;
    /** Salidas en vivo desde Elejalde 7 en Bidaide. */
    readonly salidasVivo: string;
  };
}

// "Elejalde 7" (con j) es la etiqueta oficial de la parada en Bizkaibus/Bidaide; la
// dirección del hostel sigue siendo "Elexalde Auzoa 11" (con x). Las dos correctas.
const ELEJALDE_7: BusStop = { name: "Elejalde 7", code: "1894" };
const LAGA: BusStop = { name: "Laga", code: "2394" };

export const BUS_LAGA: BusLagaInfo = {
  line: "A3526",
  lineName: "Mungia-Gernika Lumo-Ibarrangelu",
  frequency: "~cada 30 min en verano (sáb/dom)",
  journeyMins: 8,
  busStops: 5,
  walkToStopMins: 2,
  walkToStopM: 58,
  walkToBeachMins: 6,
  walkToBeachM: 450,
  doorToDoorMins: 16,
  fareEur: 2,
  walkMins: 46,
  walkKm: 3.6,
  directions: [
    {
      label: "A la playa",
      from: ELEJALDE_7,
      to: LAGA,
      // Salidas desde Elejalde 7 (parada física, foto del panel). Sirven para la playa
      // TANTO los destino "Gernika" como los "Mungia": todos pasan por Laga ~8 min después.
      departures: [
        "10:11",
        "10:36",
        "11:13",
        "11:36",
        "12:11",
        "12:35",
        "13:07",
        "13:36",
        "14:09",
        "14:46",
        "15:11",
        "15:36",
        "16:13",
        "16:36",
      ],
      note: "Salidas reales desde el panel de Elejalde 7. Destinos Gernika y Mungia: todos pasan por Laga.",
    },
    {
      label: "De vuelta",
      from: LAGA,
      to: ELEJALDE_7,
      // Sentido Ibarrangelu/Ibinaga (A3526 hacia la costa). Horas de paso por Laga (2379)
      // según la tabla de Bidaide de un sábado de verano; deja en el extremo del hostel ~8 min después.
      departures: [
        "10:27",
        "10:56",
        "11:27",
        "11:56",
        "12:28",
        "12:56",
        "13:27",
        "13:56",
        "14:37",
        "14:56",
        "15:27",
        "15:56",
        "16:27",
        "16:56",
        "17:28",
        "17:56",
      ],
      note: "Paso por la parada Laga según Bidaide (sentido Ibarrangelu). Confirma la hora en vivo.",
    },
  ],
  links: {
    horarios: "https://www.bidaide.eus/es/route/map/Bizkaibus/3526",
    salidasVivo: "https://www.bidaide.eus/es/stop/1894/Bizkaibus/3526",
    ruta: "https://www.google.com/maps/dir/?api=1&origin=Laga+Surf+Camp+Hostel%2C+Elexalde+Auzoa+11%2C+48311+Elexalde&destination=Playa+de+Laga%2C+Ibarrangelu%2C+Bizkaia&travelmode=transit",
  },
} as const;
