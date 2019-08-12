const express = require("express");
const request = require("request");
const config = require("../config");
const axios = require("axios");
const app = express();
const PORT = 3000;

app.use(express.static(__dirname + "/../client/dist"));

const dataClean = function(array) {
  const stateCheck = string => {
    if (
      string === "AS" ||
      string === "DC" ||
      string === "GU" ||
      string === "MP" ||
      string === "PR" ||
      string === "VI" ||
      string === undefined
    ) {
      return false;
    }
    return true;
  };


  const validScore = string => {
    if (string === undefined) {
      return false;
    }
    return true;
  };

  const resultObj = {};

  array.forEach(item => {
    const { state, score } = item;
    if (!stateCheck(state) || !validScore(score)) {
      return;
    }
    if (!resultObj[state]) {
      resultObj[state] = [];
      resultObj[state].push(item);
    }
    if (resultObj[state]) {
      resultObj[state].push(item);
    }
  });
  return resultObj;
};

const averagePerState = array => {
  let count = 0;
  let total = 0;

  array.forEach(item => {
    if (item.score !== "Not Available") {
      total += Number(item.score);
      count++;
    }
  });
  const average = Math.round(total / count);
  return {
    mortalityScore: average
  };
};

const averageObj = obj => {
  let result = {};
  for (let keys in obj) {
    result[keys] = averagePerState(obj[keys]);
  }
  return result;
};

app.get("/api/heartFailures", (req, res) => {
  let options = {
    url: "https://data.medicare.gov/resource/ukfj-tt6v.json",
    headers: {
      "User-Agent": "request",
      Host: "data.medicare.gov",
      Accept: "application/json",
      "X-App-Token": config.DATA_MEDICARE_GOV_APP_TOKEN
    },
    data: {
      $select: "state, score",
      $where:
        "measure_name=Death rate for heart failure patients AND measure_id=MORT_30_HF"
    }
  };

  axios
    .get("https://data.medicare.gov/resource/ukfj-tt6v.json", options)
    .then(results => {
      const cleanedObj = dataClean(results.data);
      const finalResult = averageObj(cleanedObj);
      res.send(finalResult);
    })
    .catch(err => {
      res.send(err);
    });
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
