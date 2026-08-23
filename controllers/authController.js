const bcrypt = require('bcryptjs');
const { readUsers, writeUsers, readSubscriptions, getSubscriptionForSchool, readTickets, writeTickets } = require('../utils/dbHelper');

// Helper to extract school key from headers or request parameters
const getSchool = (req) => {
    const school = req.headers['x-school-key'] || req.query.school || (req.body && req.body.school);
    if (!school) return (process.env.VITE_SCHOOL_CODE || 'NHSST').toUpperCase().trim();
    return school.toUpperCase().trim();
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and start session
 */
exports.login = async (req, res) => {
    const { username, password, school } = req.body;
    const targetSchool = (school || process.env.VITE_SCHOOL_CODE || 'NHSST').toUpperCase().trim();

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    // Global Super Admin check against environment credentials
    const superUser = (process.env.SUPER_ADMIN_USER || 'master').trim().toLowerCase();
    const superPass = (process.env.SUPER_ADMIN_PASS || 'master123').trim();

    const normUser = username.trim().toLowerCase();
    const normPass = password.toString().trim();

    const schoolSub = getSubscriptionForSchool(targetSchool);

    if (normUser === superUser && normPass === superPass) {
        return res.status(200).json({
            success: true,
            message: 'Super Admin login successful.',
            data: {
                username: superUser,
                role: 'SUPER_ADMIN',
                fullName: 'Super Administrator',
                school: targetSchool,
                subscription: schoolSub
            }
        });
    }

    // Check if school subscription is active (ignore for master admin)
    const isExpired = schoolSub.expiresAt && new Date(schoolSub.expiresAt) < new Date();
    if (schoolSub.status === 'SUSPENDED' || isExpired) {
        const errorMsg = isExpired 
            ? 'This campus database subscription license has expired. Please contact master@localhost for renewal support.'
            : 'This campus database subscription is suspended. Please contact master@localhost for support.';
        return res.status(403).json({ success: false, error: errorMsg });
    }

    // Standard school-specific authentication
    const usersDB = readUsers(targetSchool);
    const user = usersDB.find(u => u.username.toLowerCase() === normUser);

    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid username, password, or school selection.' });
    }

    // Support bcrypt hashed passwords & auto-migrate plaintext passwords on login
    let isMatch = false;
    const userPwd = (user.password || '').toString();
    if (userPwd.startsWith('$2a$') || userPwd.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(normPass, userPwd);
    } else {
        isMatch = (userPwd.trim() === normPass);
        // Auto-hash plaintext password on successful login
        if (isMatch) {
            try {
                user.password = await bcrypt.hash(normPass, 10);
                writeUsers(usersDB, targetSchool);
            } catch (e) {}
        }
    }

    if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid username, password, or school selection.' });
    }

    return res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
            username: user.username,
            role: user.role,
            fullName: user.fullName,
            school: targetSchool,
            subscription: schoolSub
        }
    });
};

/**
 * @route   POST /api/v1/auth/users
 * @desc    Admin creates a new user
 */
exports.createUser = async (req, res) => {
    const { fullName, username, password, role, roleBadge, school } = req.body;
    const targetSchool = school ? school.toUpperCase().trim() : getSchool(req);
    const callerRole = req.headers['x-caller-role'] || '';

    if (!fullName || !username || !password) {
        return res.status(400).json({ success: false, error: 'Full name, username, and password are required.' });
    }

    // Enforce role creation constraints: standard ADMIN cannot create a SUPER_ADMIN
    if (callerRole === 'ADMIN' && (role || '').toUpperCase() === 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, error: 'Only Super Admins can register other Super Admin accounts.' });
    }

    const normUser = username.trim().toLowerCase();
    const usersDB = readUsers(targetSchool);
    if (usersDB.some(u => u.username.toLowerCase() === normUser)) {
        return res.status(400).json({ success: false, error: `Username already exists in school ${targetSchool}.` });
    }

    const maxId = usersDB.reduce((max, u) => u.id > max ? u.id : max, 0);
    const hashedPassword = await bcrypt.hash(password.toString().trim(), 10);

    const newUser = {
        id: maxId + 1,
        fullName: fullName.trim(),
        username: normUser,
        password: hashedPassword,
        role: (role || 'USER').toUpperCase(),
        roleBadge: roleBadge ? roleBadge.trim() : (role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'ADMIN' ? 'IT Admin' : 'School Staff'),
        createdAt: new Date().toISOString()
    };

    usersDB.push(newUser);
    writeUsers(usersDB, targetSchool);

    return res.status(201).json({
        success: true,
        message: `User created successfully in school ${targetSchool}.`,
        data: {
            username: newUser.username,
            role: newUser.role,
            roleBadge: newUser.roleBadge,
            fullName: newUser.fullName,
            school: targetSchool
        }
    });
};

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Super Admin / Admin resets a user's password with bcrypt encryption
 */
exports.resetPassword = async (req, res) => {
    const { username, newPassword, school } = req.body;
    const targetSchool = school ? school.toUpperCase().trim() : getSchool(req);

    if (!username || !newPassword || !newPassword.trim()) {
        return res.status(400).json({ success: false, error: 'Username and new password are required.' });
    }

    const normUser = username.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(newPassword.toString().trim(), 10);

    // 1. Check school database
    const usersDB = readUsers(targetSchool);
    const user = usersDB.find(u => u.username.toLowerCase() === normUser);

    if (user) {
        user.password = hashedPassword;
        writeUsers(usersDB, targetSchool);
        return res.status(200).json({
            success: true,
            message: `Password for user @${user.username} in school ${targetSchool} has been reset and encrypted successfully.`
        });
    }

    // 2. Check all schools if not specified
    let foundAndUpdated = false;
    try {
        const { SCHOOLS } = require('../utils/dbHelper');
        for (const sch of SCHOOLS) {
            const schUsers = readUsers(sch);
            const schUser = schUsers.find(u => u.username.toLowerCase() === normUser);
            if (schUser) {
                schUser.password = hashedPassword;
                writeUsers(schUsers, sch);
                foundAndUpdated = true;
                break;
            }
        }
    } catch (e) {}

    if (foundAndUpdated) {
        return res.status(200).json({
            success: true,
            message: `Password for user @${normUser} has been reset and encrypted successfully.`
        });
    }

    return res.status(404).json({ success: false, error: `User account @${normUser} not found.` });
};

/**
 * @route   GET /api/v1/auth/users
 * @desc    Get all registered users for a school
 */
exports.getUsers = (req, res) => {
    const targetSchool = getSchool(req);
    const usersDB = readUsers(targetSchool);

    const sanitizedUsers = usersDB.map(({ password, ...u }) => u);

    return res.status(200).json({
        success: true,
        data: sanitizedUsers
    });
};

/**
 * @route   DELETE /api/v1/auth/users/:id
 * @desc    Delete a user account from school database (Admin / Super Admin only)
 */
exports.deleteUser = (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const callerRole = req.headers['x-caller-role'] || '';
    const callerUsername = req.headers['x-caller-username'] || '';
    const targetSchool = getSchool(req);

    const usersDB = readUsers(targetSchool);
    const userIndex = usersDB.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    const user = usersDB[userIndex];

    // Prevent self-deletion
    if (user.username.toLowerCase() === callerUsername.toLowerCase()) {
        return res.status(400).json({ success: false, error: 'You cannot delete your own logged-in account.' });
    }

    const superUser = (process.env.SUPER_ADMIN_USER || 'master').trim().toLowerCase();
    const adminUser = (process.env.DEFAULT_ADMIN_USER || 'admin').trim().toLowerCase();
    if (user.username.toLowerCase() === adminUser || user.username.toLowerCase() === superUser) {
        return res.status(400).json({ success: false, error: 'Protected core system accounts cannot be deleted.' });
    }

    // Role-based limits: Standard ADMIN can ONLY delete USER role (cannot delete other ADMIN or SUPER_ADMIN)
    if (callerRole === 'ADMIN') {
        if (user.role !== 'USER') {
            return res.status(403).json({ success: false, error: 'IT Admins can only delete School Staff user accounts. Only Super Admins can delete other Admins.' });
        }
    }

    usersDB.splice(userIndex, 1);
    writeUsers(usersDB, targetSchool);

    return res.status(200).json({
        success: true,
        message: `Account for ${user.fullName} deleted successfully from ${targetSchool}.`
    });
};

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update display name (fullName) for logged-in user or admin
 */
exports.updateProfile = (req, res) => {
    const { username, fullName, school } = req.body;
    const targetSchool = school ? school.toUpperCase().trim() : getSchool(req);

    if (!username || !fullName || !fullName.trim()) {
        return res.status(400).json({ success: false, error: 'Username and new full name are required.' });
    }

    const normUser = username.trim().toLowerCase();
    const newName = fullName.trim();

    // Check if updating Super Admin
    const superUser = (process.env.SUPER_ADMIN_USER || 'master').trim().toLowerCase();
    if (normUser === superUser) {
        try {
            const usersDB = readUsers(targetSchool);
            const user = usersDB.find(u => u.username.toLowerCase() === normUser);
            if (user) {
                user.fullName = newName;
                writeUsers(usersDB, targetSchool);
            }
        } catch (e) {}

        // Also update past tickets for Super Admin
        try {
            const ticketsDB = readTickets(targetSchool);
            let updatedCount = 0;
            ticketsDB.forEach(t => {
                if ((t.reportedBy && t.reportedBy.toLowerCase() === normUser) || (t.userName && t.userName.toLowerCase() === normUser)) {
                    t.userName = newName;
                    updatedCount++;
                }
            });
            if (updatedCount > 0) {
                writeTickets(ticketsDB, targetSchool);
            }
        } catch (e) {}

        return res.status(200).json({
            success: true,
            message: 'Super Admin profile updated successfully.',
            data: {
                username: superUser,
                fullName: newName
            }
        });
    }

    const usersDB = readUsers(targetSchool);
    const user = usersDB.find(u => u.username.toLowerCase() === normUser);

    if (!user) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    const oldName = user.fullName;
    user.fullName = newName;
    writeUsers(usersDB, targetSchool);

    // Update tickets associated with this user
    try {
        const ticketsDB = readTickets(targetSchool);
        let updatedCount = 0;
        ticketsDB.forEach(t => {
            if (
                (t.reportedBy && t.reportedBy.toLowerCase() === normUser) ||
                (t.userName && (t.userName === oldName || t.userName.toLowerCase() === normUser))
            ) {
                t.userName = newName;
                updatedCount++;
            }
        });
        if (updatedCount > 0) {
            writeTickets(ticketsDB, targetSchool);
        }
    } catch (e) {
        console.error('Failed to sync ticket reporter names:', e);
    }

    return res.status(200).json({
        success: true,
        message: 'Profile display name updated successfully.',
        data: {
            username: user.username,
            role: user.role,
            fullName: user.fullName,
            school: targetSchool
        }
    });
};

/**
 * @route   PATCH /api/v1/auth/users/:id/role
 * @desc    Update user role & roleBadge
 */
exports.updateUserRole = (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { role, roleBadge } = req.body;
    const targetSchool = getSchool(req);

    const usersDB = readUsers(targetSchool);
    const user = usersDB.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    if (role) user.role = role.toUpperCase();
    if (roleBadge) user.roleBadge = roleBadge.trim();

    writeUsers(usersDB, targetSchool);

    return res.status(200).json({
        success: true,
        message: `Updated role badge for user @${user.username}.`,
        data: { id: user.id, role: user.role, roleBadge: user.roleBadge }
    });
};
