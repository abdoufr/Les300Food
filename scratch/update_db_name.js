
const { createClient } = require('@libsql/client');

const db = createClient({
    url: "libsql://menu-abdoufr.aws-ap-northeast-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzc0MTg2NDksImlkIjoiMDE5ZGQxODUtMmEwMS03ODYyLTg4MTQtN2RjMDQ5Y2JkNzg4IiwicmlkIjoiMTdiNDAyYmUtMGU3Mi00MWM2LWFiODItOTM3ODJmYzVlMDdjIn0.XNMqxhZAtohCY5M5-k8C2PUgF0kkTuqLeKeUOziFMGUQ5-GiG6hI4IO5jaSWpTuyZs4rniYxIa14_igRDNrmAg",
});

async function updateName() {
    console.log('Updating site name to 300FOOD in database...');
    try {
        await db.execute({
            sql: "UPDATE settings SET value = '300FOOD' WHERE key = 'site_name'",
            args: []
        });
        console.log('Successfully updated site name!');
    } catch (e) {
        console.error('Error updating name:', e);
    }
}

updateName();
