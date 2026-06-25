// import http from 'k6/http';
// import { check, sleep } from 'k6';

// export const options = {
//     vus: 50, // 50 virtual users
//     duration: '30s', // run for 30 seconds
// };

// export default function () {
//     const url = 'http://localhost:3000/api/scraper'; // Replace with your actual URL
//     const payload = JSON.stringify({
//         filters: { role: 'developer' },
//     });

//     const params = {
//         headers: {
//             'Content-Type': 'application/json',
//         },
//     };

//     const res = http.post(url, payload, params);

//     // Verify the response is successful
//     check(res, {
//         'is status 200': (r) => r.status === 200,
//     });

//     sleep(1); // Wait 1 second between requests per user
// }



import http from 'k6/http';
import { check } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 1000 },  // Ramp to 1000 users
        { duration: '30s', target: 3000 },  // Ramp to 3000 users
        { duration: '30s', target: 5000 },  // Ramp to 5000 users
        { duration: '60s', target: 5000 },  // Hold 5000 users
        { duration: '30s', target: 0 },     // Ramp down
    ],

    thresholds: {
        http_req_failed: ['rate<0.01'], // <1% errors
        http_req_duration: ['p(95)<1000'],
    },
};

export default function () {
    const url = 'http://localhost:3000/api/auth/login';

    const payload = JSON.stringify({
        email: 'manoj-final-test@admin.com',
        password: 'password123',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(url, payload, params);

    check(res, {
        'logged in successfully': (r) => r.status === 200,
    });
}