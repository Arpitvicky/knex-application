import knex from "knexClient";
import getAvailabilities from "./getAvailabilities";

describe("getAvailabilities", () => {
    beforeEach(() => knex("events").truncate());

    describe("case when there is no events data", () => {
        it("should return an empty availabilities", async () => {
            const availabilities = await getAvailabilities(
                new Date("2014-08-10")
            );
            expect(availabilities).toEqual([]);
        });
    });
    describe("case when we have a non-recurring event with no appointment and it lies in the available days", () => {
        beforeEach(async () => {
            await knex("events").insert([
                {
                    kind: "opening",
                    starts_at: new Date("2020-04-17 09:30"),
                    ends_at: new Date("2020-04-17 12:30"),
                    weekly_recurring: false,
                },
            ]);
        });
        it("should return the availabilities for 7 days", async () => {
            const availabilities = await getAvailabilities(
                new Date("2020-04-13")
            );
            expect(availabilities).toHaveLength(7);
        });
        it("should return correct available slots for the opening day", async () => {
            const availabilities = await getAvailabilities(
                new Date("2020-04-13")
            );
            expect(availabilities[3].slots).toEqual([]);
            expect(availabilities[4].slots).toEqual([
                "9:30",
                "10:00",
                "10:30",
                "11:00",
                "11:30",
                "12:00",
            ]);
            expect(String(availabilities[6].date)).toBe(
                String(new Date("2020-04-19"))
            );
        });
    });
    describe("case when we have a non-recurring event with an appointment and it lies in the available days", () => {
        beforeEach(async () => {
            await knex("events").insert([
                {
                    kind: "opening",
                    starts_at: new Date("2020-04-17 09:30"),
                    ends_at: new Date("2020-04-17 12:30"),
                    weekly_recurring: false,
                },
                {
                    kind: "appointment",
                    starts_at: new Date("2020-04-17 09:30"),
                    ends_at: new Date("2020-04-17 12:00"),
                },
            ]);
        });
        it("should return the availabilities for 7 days", async () => {
            const availabilities = await getAvailabilities(
                new Date("2020-04-13")
            );
            expect(availabilities).toHaveLength(7);
        });
        it("should return correct available slots for the appointment day", async () => {
            const availabilities = await getAvailabilities(
                new Date("2020-04-13")
            );
            expect(availabilities[4].slots).toEqual(["12:00"]);
        });
    });
    describe("case when we have a recurring event and a non-recurring event with many appointment and they lie in the available days", () => {
        beforeEach(async () => {
            await knex("events").insert([
                {
                    kind: "opening",
                    starts_at: new Date("2020-04-02 10:30"),
                    ends_at: new Date("2020-04-02 12:30"),
                    weekly_recurring: true,
                },
                {
                    kind: "opening",
                    starts_at: new Date("2020-04-17 09:30"),
                    ends_at: new Date("2020-04-17 12:30"),
                    weekly_recurring: false,
                },
                {
                    kind: "appointment",
                    starts_at: new Date("2020-04-17 09:30"),
                    ends_at: new Date("2020-04-17 12:00"),
                },
                {
                    kind: "appointment",
                    starts_at: new Date("2020-04-16 09:30"),
                    ends_at: new Date("2020-04-16 11:30"),
                },
                {
                    kind: "appointment",
                    starts_at: new Date("2020-04-23 09:30"),
                    ends_at: new Date("2020-04-23 11:30"),
                },
            ]);
        });
        it("should return the availabilities for 7 days", async () => {
            const availabilities = await getAvailabilities(
                new Date("2020-04-13")
            );
            expect(availabilities).toHaveLength(7);
        });
        it("should return correct available slots for appointment and non-appointment days", async () => {
            const availabilities = await getAvailabilities(
                new Date("2020-04-13")
            );
            expect(String(availabilities[0].date)).toBe(
                String(new Date("2020-04-13"))
            );
            expect(String(availabilities[3].date)).toBe(
                String(new Date("2020-04-16"))
            );
            expect(availabilities[3].slots).toEqual(["11:30", "12:00"]);
            expect(String(availabilities[4].date)).toBe(
                String(new Date("2020-04-17"))
            );
            expect(availabilities[4].slots).toEqual(["12:00"]);
            expect(availabilities[6].slots).toEqual([]);
        });
    });
    describe("simple case", () => {
        beforeEach(async () => {
            await knex("events").insert([
                {
                    kind: "opening",
                    starts_at: new Date("2014-08-04 09:30"),
                    ends_at: new Date("2014-08-04 12:30"),
                    weekly_recurring: true,
                },
                {
                    kind: "appointment",
                    starts_at: new Date("2014-08-11 10:30"),
                    ends_at: new Date("2014-08-11 11:30"),
                },
            ]);
        });

        it("should fetch availabilities correctly", async () => {
            const availabilities = await getAvailabilities(
                new Date("2014-08-10")
            );
            expect(availabilities.length).toBe(7);

            expect(String(availabilities[0].date)).toBe(
                String(new Date("2014-08-10"))
            );
            expect(availabilities[0].slots).toEqual([]);

            expect(String(availabilities[1].date)).toBe(
                String(new Date("2014-08-11"))
            );
            expect(availabilities[1].slots).toEqual([
                "9:30",
                "10:00",
                "11:30",
                "12:00",
            ]);

            expect(availabilities[2].slots).toEqual([]);

            expect(String(availabilities[6].date)).toBe(
                String(new Date("2014-08-16"))
            );
        });
    });
});
