CREATE TABLE weekly_food_menus (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    day_of_week VARCHAR(16) NOT NULL,
    day_order INT NOT NULL,
    breakfast VARCHAR(255) NOT NULL,
    lunch VARCHAR(255) NOT NULL,
    dinner VARCHAR(255) NOT NULL,
    snacks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_weekly_food_menus_owner_prop ON weekly_food_menus(owner_id, property_id, day_of_week);
