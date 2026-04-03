import fetch from 'node-fetch';

const testAddProject = async () => {
    const projectData = {
        projectName: "Test Project Location",
        donorAgency: "USAID",
        targetLocation: "Hanguranketha",
        startDate: "2026-04-01",
        endDate: "2026-06-01",
        budget: 1000000,
        status: "Active",
        description: "Testing if location saves correctly."
    };

    try {
        const response = await fetch('http://localhost:5000/api/projects', {
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });

        const data = await response.json();
        console.log("Response Status:", response.status);
        console.log("Response Data:", JSON.stringify(data, null, 2));

        if (data.target_location === "Hanguranketha") {
            console.log("✅ Success: target_location saved correctly.");
        } else {
            console.log("❌ Failure: target_location is", data.target_location);
        }
    } catch (error) {
        console.error("Test failed:", error.message);
    }
};

testAddProject();
