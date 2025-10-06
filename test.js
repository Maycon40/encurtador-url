async function main() {
  const response = await fetch("http://localhost:3000/shorten", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: "https://www.google.com/",
    }),
  });

  console.log("response", response);
  console.log("response", await response.text());
  //  console.log("response", await response.json());
}

//main();

async function delete1() {
  const response = await fetch("http://localhost:3000/22e9ecee", {
    method: "DELETE",
  });

  console.log("response", response);
  console.log("response", await response.text());
  //  console.log("response", await response.json());
}

//delete1();
