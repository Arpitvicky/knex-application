import moment from "moment";
import knex from "knexClient";

type eventKind = "opening" | "appointment";
interface IEvent {
    kind: eventKind;
    starts_at: number;
    ends_at: number;
    weekly_recurring?: boolean;
}
interface IAvailableDay {
    date: string;
    slots: string[];
}
const numOfDays = 7;

// create availabilities array with empty slots for given number of days.
const makeInitialAvailabilitiesData = (date: Date) => {
    return Array.from({ length: numOfDays }, (e, i) => {
        const nextDay = moment(date).add(i, "days");
        return {
            date: nextDay.toDate(), //converts to native javascript date object
            slots: [],
        };
    });
};

//Function to get slots for a start and end time.
const getSlots = (
    eventStartDateTime: moment.Moment,
    eventEndDateTime: moment.Moment
) => {
    const slots = [];
    //return empty slots if startdate is not same as end day
    if (!eventStartDateTime.isSame(eventEndDateTime, "day")) {
        return [];
    }
    //make slots from event time
    for (
        let date = eventStartDateTime;
        date < eventEndDateTime;
        date.add(0.5, "h")
    ) {
        const slot = date.format("h:mm");
        slots.push(slot);
    }
    return slots;
};
const getAvailabilitiesWithAllSlots = (
    availabilities: IAvailableDay[],
    event: IEvent
) => {
    const eventStartDateTime = moment(event.starts_at);
    const eventEndDateTime = moment(event.ends_at);

    if (!eventStartDateTime.isSame(eventEndDateTime, "day")) {
        return availabilities;
    }
    return availabilities.reduce((acc, availableDay) => {
        // If the event is recurring then check for same weekday in the availabilities array
        if (
            event.weekly_recurring &&
            eventStartDateTime.format("d") ===
                moment(availableDay.date).format("d")
        ) {
            const slots = getSlots(eventStartDateTime, eventEndDateTime);

            acc.push({
                date: availableDay.date,
                slots,
            });
        }
        //If event is not recurring then event date should be among the available dates to fill the slots.
        else if (
            !event.weekly_recurring &&
            eventStartDateTime.isSame(moment(availableDay.date), "day")
        ) {
            const slots = getSlots(eventStartDateTime, eventEndDateTime);
            acc.push({
                date: availableDay.date,
                slots,
            });
        } else {
            acc.push(availableDay);
        }
        return acc;
    }, []);
};

const getAvailabilitiesWithFilteredSlots = (
    availabilities: IAvailableDay[],
    event: IEvent
) => {
    const eventStartDateTime = moment(event.starts_at);
    const eventEndDateTime = moment(event.ends_at);

    return availabilities.map(({ date, slots }, i) => {
        if (moment(date).isSame(eventStartDateTime, "day")) {
            const busyTimeSlots = getSlots(
                eventStartDateTime,
                eventEndDateTime
            );
            const freeSlots = slots.filter(function (slot) {
                return !busyTimeSlots.includes(slot);
            });
            return {
                date,
                slots: freeSlots,
            };
        }
        return {
            date,
            slots,
        };
    });
};

const getAvailabilities = async (date: Date) => {
    let availabilities = [];
    const events: IEvent[] = await knex("events").select("*");

    // If for some reason we don't get the events, we return empty availabilities.
    if (!events?.length) {
        return [];
    }
    // Create next 7 days availabilities array with date and empty slots.
    availabilities = makeInitialAvailabilitiesData(date);
    for (const event of events) {
        if (event.kind === "opening") {
            //Get the availabilities the slots for the event days matching in available dates
            availabilities = getAvailabilitiesWithAllSlots(
                availabilities,
                event
            );
        } else {
            //If event is appointment then filter out the available slots for the appointment day.
            availabilities = getAvailabilitiesWithFilteredSlots(
                availabilities,
                event
            );
        }
    }
    return availabilities;
};

export default getAvailabilities;
