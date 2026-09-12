async function testPage() {
  try {
    const res = await fetch('http://localhost:3001/admin/teams/7b8b33d2-d507-4bf3-8e8b-375d540aa5b5', {
      redirect: 'manual'
    });
    console.log('Status:', res.status);
    console.log('Location:', res.headers.get('location'));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
testPage();
