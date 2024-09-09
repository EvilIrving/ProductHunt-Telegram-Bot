const TimePeriodEnum = {
  TODAY: "today",
  YESTERDAY: "yesterday",
  THIS_WEEK: "this_week",
  THIS_MONTH: "this_month",
  LAST_WEEK: "last_week",
  LAST_MONTH: "last_month",
};

function generateQueryForTimePeriod(timePeriod) {
  let today = new Date();
  let postedAfter, postedBefore;
  const dayOfWeek = today.getDay();

  switch (timePeriod) {
    case TimePeriodEnum.TODAY:
      postedAfter = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      break;
    case TimePeriodEnum.YESTERDAY:
      postedAfter = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 1
      );
      postedBefore = postedAfter;
      break;
    case TimePeriodEnum.THIS_WEEK:
      const startOfWeek = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - dayOfWeek + 1
      );
      postedAfter = new Date(
        startOfWeek.getFullYear(),
        startOfWeek.getMonth(),
        startOfWeek.getDate()
      );
      postedBefore = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + (7 - dayOfWeek)
      );
      break;
    case TimePeriodEnum.THIS_MONTH:
      postedAfter = new Date(today.getFullYear(), today.getMonth(), 1);
      postedBefore = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0 // last day of the current month
      );
      break;
    case TimePeriodEnum.LAST_WEEK:
      const startOfLastWeek = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - dayOfWeek - 6
      );
      postedAfter = new Date(
        startOfLastWeek.getFullYear(),
        startOfLastWeek.getMonth(),
        startOfLastWeek.getDate()
      );
      postedBefore = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - dayOfWeek
      );
      break;
    case TimePeriodEnum.LAST_MONTH:
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      postedAfter = lastMonth;
      postedBefore = lastMonthEnd;
      break;
    default:
      throw new Error("Invalid time period");
  }

  // Format the date to YYYY-MM-DD
  postedAfter = postedAfter.toLocaleDateString("en-US");
  if (postedBefore) {
    postedBefore = postedBefore.toLocaleDateString("en-US");
  }

  return {
    postedAfter,
    postedBefore: postedBefore ? postedBefore : undefined,
  };
}

// 测试函数
function testGenerateQueryForTimePeriod() {
  let today = new Date();
  const dayOfWeek = today.getDay();
  console.log("dayOfWeek: ", dayOfWeek);

  console.log("Testing Time Period: TODAY");
  console.log(generateQueryForTimePeriod(TimePeriodEnum.TODAY));

  console.log("\nTesting Time Period: YESTERDAY");
  console.log(generateQueryForTimePeriod(TimePeriodEnum.YESTERDAY));

  console.log("\nTesting Time Period: THIS_WEEK");
  console.log(generateQueryForTimePeriod(TimePeriodEnum.THIS_WEEK));

  console.log("\nTesting Time Period: THIS_MONTH");
  console.log(generateQueryForTimePeriod(TimePeriodEnum.THIS_MONTH));

  console.log("\nTesting Time Period: LAST_WEEK");
  console.log(generateQueryForTimePeriod(TimePeriodEnum.LAST_WEEK));

  console.log("\nTesting Time Period: LAST_MONTH");
  console.log(generateQueryForTimePeriod(TimePeriodEnum.LAST_MONTH));
}

// 调用测试函数
testGenerateQueryForTimePeriod();
