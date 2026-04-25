fetch("http://localhost:4000/api/merge/propose", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    projectId: "26f73e41-9ccc-4e71-a87f-b8428c11768f",
    authorId: "user_test",
    githubOwner: "rushi-codehub",
    githubRepo: "test"
  })
}).then(async r => {
  console.log(r.status, await r.text());
});
