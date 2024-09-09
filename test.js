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

  switch (timePeriod) {
    case TimePeriodEnum.TODAY:
      postedAfter = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate()
        )
      );
      postedBefore = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() + 1
        )
      );
      break;
    case TimePeriodEnum.YESTERDAY:
      postedAfter = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() - 1
        )
      );
      postedBefore = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate()
        )
      );
      break;
    case TimePeriodEnum.THIS_WEEK:
      const dayOfWeek = today.getUTCDay();
      const startOfWeek = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() - (dayOfWeek - (dayOfWeek === 0 ? 6 : 0))
        )
      );
      postedAfter = new Date(
        Date.UTC(
          startOfWeek.getUTCFullYear(),
          startOfWeek.getUTCMonth(),
          startOfWeek.getUTCDate()
        )
      );
      postedBefore = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() + (7 - dayOfWeek - (dayOfWeek === 0 ? 1 : 0))
        )
      );
      break;
    case TimePeriodEnum.THIS_MONTH:
      postedAfter = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
      );
      postedBefore = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1)
      );
      break;
    case TimePeriodEnum.LAST_WEEK:
      const startOfLastWeek = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() - (today.getUTCDay() - 1 + 7)
        )
      );
      postedAfter = new Date(
        Date.UTC(
          startOfLastWeek.getUTCFullYear(),
          startOfLastWeek.getUTCMonth(),
          startOfLastWeek.getUTCDate()
        )
      );
      postedBefore = new Date(
        Date.UTC(
          startOfLastWeek.getUTCFullYear(),
          startOfLastWeek.getUTCMonth(),
          startOfLastWeek.getUTCDate() + 7
        )
      );
      break;
    case TimePeriodEnum.LAST_MONTH:
      const lastMonth =
        today.getUTCMonth() === 0 ? 11 : today.getUTCMonth() - 1;
      const lastMonthYear =
        today.getUTCMonth() === 0
          ? today.getUTCFullYear() - 1
          : today.getUTCFullYear();
      postedAfter = new Date(Date.UTC(lastMonthYear, lastMonth, 1));
      postedBefore = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
      );
      break;
    default:
      throw new Error("Invalid time period");
  }

  // Format the date to YYYY-MM-DD
  postedAfter = postedAfter.toISOString().split("T")[0];
  postedBefore = postedBefore
    ? postedBefore.toISOString().split("T")[0]
    : undefined;

  return {
    postedAfter,
    postedBefore,
  };
}

function testGenerateQueryForTimePeriod() {
  const testCases = [
    {
      timePeriod: TimePeriodEnum.TODAY,
      expected: {
        postedAfter: "2024-09-10", // 假设今天是 2024-09-10
        postedBefore: "2024-09-11",
      },
    },
    {
      timePeriod: TimePeriodEnum.YESTERDAY,
      expected: {
        postedAfter: "2024-09-09", // 假设昨天是 2024-09-09
        postedBefore: "2024-09-10",
      },
    },
    {
      timePeriod: TimePeriodEnum.THIS_WEEK,
      expected: {
        postedAfter: "2024-09-09", // 假设本周开始于 2024-09-08
        postedBefore: "2024-09-15", // 假设本周结束于 2024-09-15
      },
    },
    {
      timePeriod: TimePeriodEnum.THIS_MONTH,
      expected: {
        postedAfter: "2024-09-01", // 假设本月开始于 2024-09-01
        postedBefore: "2024-10-01",
      },
    },
    {
      timePeriod: TimePeriodEnum.LAST_WEEK,
      expected: {
        postedAfter: "2024-09-02", // 假设上周开始于 2024-09-01
        postedBefore: "2024-09-08", // 假设上周结束于 2024-09-08
      },
    },
    {
      timePeriod: TimePeriodEnum.LAST_MONTH,
      expected: {
        postedAfter: "2024-08-01", // 假设上个月开始于 2024-08-01
        postedBefore: "2024-09-01",
      },
    },
  ];

  testCases.forEach((testCase) => {
    const result = generateQueryForTimePeriod(testCase.timePeriod);
    const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
    console.log(
      `Test for ${testCase.timePeriod}: ${passed ? "PASSED" : "FAILED"}`
    );
    if (!passed) {
      console.log(
        `Expected: ${JSON.stringify(
          testCase.expected
        )}, but got: ${JSON.stringify(result)}`
      );
    }
  });
}

// 调用测试函数
testGenerateQueryForTimePeriod();
