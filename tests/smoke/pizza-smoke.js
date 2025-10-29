import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:3333";
const AUTH_TOKEN = "token abcdef0123456789";

export const options = {
  vus: 5,
  duration: "15s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  // Test 1: POST /api/pizza - Obtener recomendación de pizza
  const restrictions = {
    maxCaloriesPerSlice: 500,
    mustBeVegetarian: false,
    excludedIngredients: ["pepperoni"],
    excludedTools: ["knife"],
    maxNumberOfToppings: 6,
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
    }
  );

  check(postPizzaRes, {
    "POST /api/pizza status is 200": (r) => r.status === 200,
    "POST /api/pizza has pizza name": (r) => r.json().pizza?.name !== undefined,
    "POST /api/pizza has ingredients": (r) =>
      r.json().pizza?.ingredients?.length > 0,
  });

  if (postPizzaRes.status === 200) {
    console.log(
      `Pizza: ${postPizzaRes.json().pizza.name} (${
        postPizzaRes.json().pizza.ingredients.length
      } ingredients)`
    );
  }

  sleep(0.5);

  // Test 2: GET /api/ingredients/{type} - Get toppings
  const ingredientsRes = http.get(`${BASE_URL}/api/ingredients/topping`, {
    headers: {
      Authorization: AUTH_TOKEN,
    },
  });

  check(ingredientsRes, {
    "GET /api/ingredients/topping status is 200": (r) => r.status === 200,
    "GET /api/ingredients/topping has ingredients array": (r) =>
      Array.isArray(r.json().ingredients),
  });

  sleep(1);

  // Test 3: GET /api/doughs - Get all doughs
  const doughsRes = http.get(`${BASE_URL}/api/doughs`, {
    headers: {
      Authorization: AUTH_TOKEN,
    },
  });

  check(doughsRes, {
    "GET /api/doughs status is 200": (r) => r.status === 200,
    "GET /api/doughs has doughs array": (r) => Array.isArray(r.json().doughs),
  });

  sleep(1);

  // Test 4: GET /api/tools - Get all tools
  const toolsRes = http.get(`${BASE_URL}/api/tools`, {
    headers: {
      Authorization: AUTH_TOKEN,
    },
  });

  check(toolsRes, {
    "GET /api/tools status is 200": (r) => r.status === 200,
    "GET /api/tools has tools array": (r) => Array.isArray(r.json().tools),
  });

  sleep(1);
}
