// Recurring yearly birthdays and anniversaries. month is 1-indexed.
const BIRTHDAYS = [
  { name: 'Arianne',              month: 1,  day: 31, type: 'birthday'    },
  { name: 'Zach',                 month: 11, day: 30, type: 'birthday'    },
  { name: 'Quinn',                month: 11, day: 7,  type: 'birthday'    },
  { name: 'Emerson',              month: 6,  day: 1,  type: 'birthday'    },
  { name: 'Audrey',               month: 12, day: 14, type: 'birthday'    },
  { name: 'Birdie',                month: 12, day: 18, type: 'birthday'    },
  { name: 'Sam',                  month: 4,  day: 3,  type: 'birthday'    },
  { name: 'Grandma Lauri',        month: 4,  day: 8,  type: 'birthday'    },
  { name: 'Grandpa Steve',        month: 2,  day: 24, type: 'birthday'    },
  { name: 'Parents\' Anniversary', month: 9,  day: 20, type: 'anniversary' },
];

export function getBirthdaysForYears(years) {
  const result = [];
  years.forEach(year => {
    BIRTHDAYS.forEach(b => {
      const mm = String(b.month).padStart(2, '0');
      const dd = String(b.day).padStart(2, '0');
      result.push({ date: `${year}-${mm}-${dd}`, name: b.name, type: b.type });
    });
  });
  return result;
}
