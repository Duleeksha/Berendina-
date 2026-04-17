export const PROJECT_MILESTONES = [
    { label: '1. Registration', value: 5, description: 'Onboarding & Assessment' },
    { label: '2. Preparation', value: 25, description: 'Orientation & Training' },
    { label: '3. Allocation', value: 50, description: 'Major Resource Distributed' },
    { label: '4. Monitoring', value: 80, description: 'Implementation & Visits' },
    { label: '5. Graduation', value: 100, description: 'Project Completed' }
];

export const getMilestoneFromValue = (value) => {
    // Exact match or closest lower match
    return PROJECT_MILESTONES.slice().reverse().find(m => value >= m.value) || PROJECT_MILESTONES[0];
};
