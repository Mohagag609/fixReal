// Using built-in fetch (Node.js 18+)

async function testResetPassword() {
  try {
    // First, login to get a token
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    console.log('Login status:', loginResponse.status);
    
    if (loginData.success) {
      const token = loginData.data.token;
      
      // Now test reset-password with the token
      const resetResponse = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          username: 'admin', 
          adminKey: 'ADMIN_SECRET_2024', 
          newPassword: 'newpassword123' 
        })
      });
      
      const resetData = await resetResponse.json();
      console.log('Reset password response:', resetData);
      console.log('Reset password status:', resetResponse.status);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testResetPassword();
