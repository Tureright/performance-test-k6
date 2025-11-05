import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "../../utils/html-report.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = "http://localhost:3333";
const AUTH_TOKEN = "Token abcdef0123456789";

export const options = {
  stages: [
    { duration: "2m", target: 20 },
    { duration: "3m", target: 20 },
    { duration: "2m", target: 100 },
    { duration: "3m", target: 100 },
    { duration: "2m", target: 200 },
    { duration: "3m", target: 200 },
    { duration: "2m", target: 400 },
    { duration: "3m", target: 400 },
    { duration: "5m", target: 0 },
  ],
  thresholds: {
    // Más permisivo porque esperamos degradación
    http_req_duration: [{ threshold: "p(95)<3000", abortOnFail: false }],
    http_req_duration: [{ threshold: "p(99)<5000", abortOnFail: false }],
    http_req_failed: [{ threshold: "rate<0.10", abortOnFail: false }],
    checks: [{ threshold: "rate>0.85", abortOnFail: false }],

    // Agregar: asegurar que al menos funcione con carga baja
    "http_req_duration{stage:stage_0}": [
      { threshold: "p(95)<1000", abortOnFail: false },
    ],
  },
};

export default function () {
  // Test 1: POST /api/pizza - Get pizza recommendation
  const restrictions = {
    maxCaloriesPerSlice: Math.floor(Math.random() * 500) + 300,
    mustBeVegetarian: Math.random() > 0.5,
    excludedIngredients: [],
    excludedTools: [],
    maxNumberOfToppings: Math.floor(Math.random() * 4) + 3,
    minNumberOfToppings: 2,
  };

  const postPizzaRes = http.post(
    `${BASE_URL}/api/pizza`,
    JSON.stringify(restrictions),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
      tags: { name: "PostPizza" },
    }
  );

  check(postPizzaRes, {
    "POST /api/pizza status is 200": (r) => r.status === 200,
    "POST /api/pizza has valid pizza": (r) => {
      if (r.status !== 200) return false;
      const json = r.json();
      return json.pizza?.name && json.calories > 0;
    },
  });

  sleep(0.5);

  // Test 2: GET /api/ingredients/{type}
  const types = ["olive_oil", "tomato", "mozzarella", "topping"];
  const randomType = types[Math.floor(Math.random() * types.length)];

  const ingredientsRes = http.get(`${BASE_URL}/api/ingredients/${randomType}`, {
    headers: {
      Authorization: AUTH_TOKEN,
    },
    tags: { name: "GetIngredients" },
  });

  check(ingredientsRes, {
    "GET /api/ingredients status is 200": (r) => r.status === 200,
  });

  sleep(0.5);

  // Test 3: GET /api/tools
  const toolsRes = http.get(`${BASE_URL}/api/tools`, {
    headers: {
      Authorization: AUTH_TOKEN,
    },
    tags: { name: "GetTools" },
  });

  check(toolsRes, {
    "GET /api/tools status is 200": (r) => r.status === 200,
  });

  sleep(0.5);

  // Test 4: GET /api/doughs
  const doughsRes = http.get(`${BASE_URL}/api/doughs`, {
    headers: {
      Authorization: AUTH_TOKEN,
    },
    tags: { name: "GetDoughs" },
  });

  check(doughsRes, {
    "GET /api/doughs status is 200": (r) => r.status === 200,
  });

  sleep(0.5);
}

export function handleSummary(data) {
  return {
    "results/stress/pizza-stress-report.html": htmlReport(data),
    "results/stress/pizza-stress-summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
