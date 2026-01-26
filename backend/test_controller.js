const pool = require('./src/db/connection');

const testControllerLogic = async () => {
    console.log('Testing Controller Logic...');
    try {
        const userId = 51; // Admin user
        const reqBody = {
            firstName: 'Admin',
            lastName: 'User',
            name: 'Admin User Updated', // Should override first/last
            phone: '1234567890',
            bio: 'Controller Bio Test',
            location: 'Controller Loc Test'
        };

        // --- LOGIC FROM CONTROLLER START ---

        // Derived values
        let finalFirstName = reqBody.firstName;
        let finalLastName = reqBody.lastName;

        if (reqBody.name) {
            const parts = reqBody.name.trim().split(' ');
            if (parts.length > 0) {
                finalFirstName = parts[0];
                finalLastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
            }
        }

        const finalMobile = reqBody.mobile || reqBody.phone;

        let updateFields = [];
        let values = [];
        let paramCount = 1;

        // isAdmin is true for this test
        const isAdmin = true;

        if (finalFirstName !== undefined) {
            updateFields.push(`first_name = $${paramCount}`);
            values.push(finalFirstName);
            paramCount++;
        }
        if (finalLastName !== undefined) {
            updateFields.push(`last_name = $${paramCount}`);
            values.push(finalLastName);
            paramCount++;
        }

        // Skip email/username/role checks to focus on profile data

        if (finalMobile !== undefined) {
            updateFields.push(`mobile = $${paramCount}`);
            values.push(finalMobile);
            paramCount++;
        }
        if (reqBody.bio !== undefined) {
            updateFields.push(`bio = $${paramCount}`);
            values.push(reqBody.bio);
            paramCount++;
        }
        if (reqBody.location !== undefined) {
            updateFields.push(`location = $${paramCount}`);
            values.push(reqBody.location);
            paramCount++;
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(userId); // Add ID for WHERE clause

        const query = `UPDATE users
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, username, mobile, first_name, last_name, bio, location, avatar, role, is_active`;

        console.log('Generated Query:', query);
        console.log('Values:', values);

        // --- LOGIC END ---

        const result = await pool.query(query, values);
        console.log('Controller Update Result:', result.rows[0]);

    } catch (err) {
        console.error('Controller Logic Error:', err);
    }
};

testControllerLogic();
