async function testPage() {
  try {
    // Wait for the dev server to respond
    const res = await fetch('http://localhost:3001/admin/teams/7b8b33d2-d507-4bf3-8e8b-375d540aa5b5');
    const text = await res.text();
    if (res.ok) {
      console.log('Page loaded successfully! Contains "Team Details"?', text.includes('Team Details'));
    } else {
      console.log('Page loaded with status:', res.status);
      console.log('Response body:', text);
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
testPage();
