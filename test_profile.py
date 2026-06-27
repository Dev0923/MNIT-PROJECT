import requests

res = requests.post('http://localhost:8000/api/auth/register', json={
    'phone': '1234567890',
    'name': 'Test User',
    'password': 'password',
    'otp': '123456',
    'receive_updates': False
})
print('Register:', res.status_code, res.text)

res = requests.post('http://localhost:8000/api/auth/login', json={
    'identifier': '1234567890',
    'password': 'password'
})
print('Login:', res.status_code, res.text)

if res.status_code == 200:
    token = res.json().get('access_token')
    res_profile = requests.get('http://localhost:8000/api/auth/profile', headers={'Authorization': f'Bearer {token}'})
    print('Profile:', res_profile.status_code, res_profile.text)
