erDiagram

    admins {
        INTEGER id PK
        TEXT username UK
        TEXT password_hash
        TEXT display_name
        TEXT created_at
        TEXT updated_at
    }

    spots {
        INTEGER id PK
        TEXT name
        TEXT subtitle
        TEXT type
        INTEGER route_order
        REAL map_x
        REAL map_y
        REAL latitude
        REAL longitude
        TEXT cover_image
        TEXT short_intro
        TEXT story_content
        TEXT story_source
        INTEGER next_spot_id
        TEXT navigation_url
        INTEGER is_published
        TEXT created_at
        TEXT updated_at
    }

    audios {
        INTEGER id PK
        INTEGER spot_id FK
        TEXT title
        TEXT audio_url
        INTEGER duration
        TEXT transcript
        TEXT audio_type
        TEXT record_time
        TEXT record_location
        TEXT narrator
        TEXT authorization_status
        INTEGER is_public
        INTEGER sort_order
        TEXT created_at
        TEXT updated_at
    }

    quiz_questions {
        INTEGER id PK
        INTEGER spot_id FK
        TEXT question
        TEXT question_type
        TEXT options_json
        TEXT correct_answer
        TEXT explanation
        INTEGER is_published
        TEXT created_at
        TEXT updated_at
    }

    service_points {
        INTEGER id PK
        TEXT name
        TEXT type
        TEXT address
        REAL map_x
        REAL map_y
        REAL latitude
        REAL longitude
        TEXT description
        TEXT opening_hours
        TEXT navigation_url
        INTEGER is_published
        TEXT created_at
        TEXT updated_at
    }

    feedbacks {
        INTEGER id PK
        TEXT visitor_id
        INTEGER completed_spot_count
        INTEGER clarity_score
        INTEGER immersion_score
        INTEGER emotion_score
        INTEGER knowledge_score
        INTEGER action_score
        INTEGER share_intention
        INTEGER recommend_intention
        INTEGER revisit_intention
        INTEGER purchase_intention
        INTEGER study_intention
        INTEGER payment_intention
        TEXT suggestions
        TEXT created_at
    }

    user_events {
        INTEGER id PK
        TEXT visitor_id
        TEXT event_type
        INTEGER spot_id FK
        TEXT event_value
        TEXT created_at
    }

    spots ||--o{ audios : "拥有"
    spots ||--o{ quiz_questions : "拥有"
    spots ||--o{ user_events : "关联"