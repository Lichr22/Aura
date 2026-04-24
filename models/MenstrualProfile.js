/**
 * Representa el perfil biológico de la usuaria.
 * Requisito UML: PerfilMenstrual
 */
export class MenstrualProfile {
    constructor(userId, age = 25, averageCycleDuration = 28, periodDuration = 5, useContraceptives = false) {
        this.userId = userId;
        this.age = age;
        this.averageCycleDuration = averageCycleDuration;
        this.periodDuration = periodDuration;
        this.useContraceptives = useContraceptives;
    }

    /**
     * Actualiza los datos del perfil
     */
    update(data) {
        if (data.age) this.age = parseInt(data.age);
        if (data.averageCycleDuration) this.averageCycleDuration = parseInt(data.averageCycleDuration);
        if (data.periodDuration) this.periodDuration = parseInt(data.periodDuration);
        if (data.useContraceptives !== undefined) this.useContraceptives = data.useContraceptives;
    }
}
