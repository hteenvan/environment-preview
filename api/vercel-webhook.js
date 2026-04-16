export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { type, payload } = req.body;

  // Only act when deployment is ready
  if (type !== "deployment.succeeded") return res.status(200).end();

  const deploymentUrl = `https://${payload.url}`;
  const branchName = payload.meta?.githubCommitRef;

  if (!branchName) return res.status(200).end();

  // branchName is your Jira ticket key e.g. KAN-5
  const issueKey = branchName.toUpperCase();

  // Post comment to Jira
  await fetch(
    `https://${process.env.JIRA_DOMAIN}/rest/api/3/issue/${issueKey}/comment`,
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(
          `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
        ).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: {
          type: "doc",
          version: 1,
          content: [{
            type: "paragraph",
            content: [{
              type: "text",
              text: `Preview ready for ${issueKey}: ${deploymentUrl}`,
              marks: [{ type: "link", attrs: { href: deploymentUrl } }]
            }]
          }]
        }
      }),
    }
  );

  res.status(200).json({ ok: true });
}

