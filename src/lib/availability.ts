export interface MealAvailability {
  isAvailable: boolean;
  availableQuantity?: number;
  schedule?: {
    monday: { isAvailable: boolean; timeSlots: { start: string; end: string }[] };
    tuesday: { isAvailable: boolean; timeSlots: { start: string; end: string }[] };
    wednesday: { isAvailable: boolean; timeSlots: { start: string; end: string }[] };
    thursday: { isAvailable: boolean; timeSlots: { start: string; end: string }[] };
    friday: { isAvailable: boolean; timeSlots: { start: string; end: string }[] };
    saturday: { isAvailable: boolean; timeSlots: { start: string; end: string }[] };
    sunday: { isAvailable: boolean; timeSlots: { start: string; end: string }[] };
  };
}

export function checkMealAvailability(
  meal: { availability?: MealAvailability },
  language: string
): { available: boolean; message?: string } {
  // 1. Explicit availability flag
  if (meal.availability && meal.availability.isAvailable === false) {
    return {
      available: false,
      message: language === "en" ? "Unavailable" : "Agotado",
    };
  }

  // 2. Quantity check
  if (
    meal.availability?.availableQuantity !== undefined &&
    meal.availability.availableQuantity !== null &&
    meal.availability.availableQuantity <= 0
  ) {
    return {
      available: false,
      message: language === "en" ? "Sold out" : "Agotado",
    };
  }

  // 3. Schedule check
  const schedule = meal.availability?.schedule;
  if (schedule && Object.keys(schedule).length > 0) {
    const now = new Date();
    const daysEn = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = daysEn[now.getDay()] as keyof typeof schedule;

    const daySchedule = schedule[dayName];
    // If the schedule object exists but this specific day is explicitly unavailable
    if (daySchedule && daySchedule.isAvailable === false) {
      const activeDays: string[] = [];
      const activeDaysEn: string[] = [];

      const dayTranslations: Record<string, string> = {
        monday: "Lunes",
        tuesday: "Martes",
        wednesday: "Miércoles",
        thursday: "Jueves",
        friday: "Viernes",
        saturday: "Sábados",
        sunday: "Domingos",
      };
      const dayTranslationsEn: Record<string, string> = {
        monday: "Mondays",
        tuesday: "Tuesdays",
        wednesday: "Wednesdays",
        thursday: "Thursdays",
        friday: "Fridays",
        saturday: "Saturdays",
        sunday: "Sundays",
      };

      Object.keys(schedule).forEach((key) => {
        if (schedule[key as keyof typeof schedule]?.isAvailable !== false) {
          activeDays.push(dayTranslations[key] || key);
          activeDaysEn.push(dayTranslationsEn[key] || key);
        }
      });

      if (activeDays.length === 0) {
        return {
          available: false,
          message: language === "en" ? "Unavailable" : "Agotado",
        };
      }

      const daysMessage =
        language === "en"
          ? `Only on: ${activeDaysEn.join(", ")}`
          : `Solo: ${activeDays.join(", ")}`;

      return {
        available: false,
        message: daysMessage,
      };
    }

    if (
      daySchedule &&
      daySchedule.isAvailable !== false &&
      daySchedule.timeSlots &&
      daySchedule.timeSlots.length > 0
    ) {
      const currentTime = now.toTimeString().slice(0, 5);
      const isTimeOk = daySchedule.timeSlots.some(
        (slot) => currentTime >= slot.start && currentTime <= slot.end
      );

      if (!isTimeOk) {
        const slotsStr = daySchedule.timeSlots
          .map((s) => `${s.start} - ${s.end}`)
          .join(", ");
        const timeMessage =
          language === "en" ? `Only ${slotsStr}` : `Solo de ${slotsStr}`;

        return {
          available: false,
          message: timeMessage,
        };
      }
    }
  }

  return { available: true };
}
