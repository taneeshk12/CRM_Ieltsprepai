# IELTS Admin Analytics Dashboard

## Overview

This comprehensive analytics dashboard provides detailed insights into user behavior, engagement, and business metrics for your IELTS preparation platform. The system tracks user activity across all features to help you make data-driven decisions for product launch and growth.

## Analytics Schema

### Additional Tables for Tracking

The following tables have been designed to track comprehensive user analytics:

#### `user_sessions`
- **Purpose**: Track user login/logout times and session duration
- **Key Fields**:
  - `user_id`: User identifier
  - `session_start/end`: Session timing
  - `duration_minutes`: Session length
  - `device_type/browser/ip_address`: Technical context

#### `user_page_views`
- **Purpose**: Track user navigation and page engagement
- **Key Fields**:
  - `user_id`: User identifier
  - `page_path/title`: What pages users visit
  - `time_spent_seconds`: Engagement duration
  - `referrer`: How users arrived at pages

#### `user_feature_usage`
- **Purpose**: Track specific feature interactions
- **Key Fields**:
  - `user_id`: User identifier
  - `feature_name`: Which feature (essay_writing, full_test, etc.)
  - `action`: What action (start, complete, cancel, retry)
  - `metadata`: Additional context (scores, time taken, etc.)

#### `user_progress`
- **Purpose**: Track learning progress and skill development
- **Key Fields**:
  - `user_id`: User identifier
  - `skill_area`: Writing, reading, speaking, listening
  - `current_level`: Beginner, intermediate, advanced
  - `average_score`: Performance metrics
  - `improvement_rate`: Learning velocity

#### `user_feedback`
- **Purpose**: Track user satisfaction and feedback
- **Key Fields**:
  - `user_id`: User identifier
  - `feedback_type`: Rating, review, bug report, feature request
  - `rating`: 1-5 scale satisfaction
  - `feedback_text`: Detailed feedback

#### `user_acquisition`
- **Purpose**: Track marketing attribution and user sources
- **Key Fields**:
  - `user_id`: User identifier
  - `source/medium/campaign`: Marketing attribution
  - `landing_page`: Entry point
  - `referrer_url`: Traffic source

## Dashboard Metrics

### Key Performance Indicators (KPIs)

1. **Total Users**: Overall user base with daily growth
2. **Total Revenue**: Complete revenue tracking with ARPU
3. **Active Users**: 30-day active user count
4. **Conversion Rate**: Percentage of users who make payments

### User Analytics

1. **New Users (7 days)**: User acquisition trends
2. **User Retention (30d)**: Percentage of users returning
3. **Engagement Rate**: Activity completion percentage

### Feature Usage Analytics

1. **Essay Writing**: Essay submissions with average band scores
2. **Full Tests**: Complete test attempts with performance metrics
3. **Reading Tests**: Reading practice session counts
4. **Speaking Tests**: Speaking practice session counts

### Trial & Free Usage

1. **Trial Users**: Users who completed trial periods
2. **Free Test Attempts**: IP-based free trial tracking

### Recent Activity Feed

Real-time activity stream showing:
- New user registrations
- Payment completions
- Essay submissions
- Test completions

## Implementation Guide

### Database Setup

Run the `analytics_schema.sql` file in your Supabase database to create the additional analytics tables:

```sql
-- Execute the contents of analytics_schema.sql in your Supabase SQL editor
```

### Frontend Integration

The analytics dashboard automatically calculates metrics from your existing data. For enhanced tracking, implement the following in your main application:

#### Session Tracking
```javascript
// On user login
await supabase.from('user_sessions').insert({
  user_id: user.id,
  session_start: new Date(),
  device_type: detectDeviceType(),
  browser: detectBrowser(),
  ip_address: getClientIP()
});

// On user logout or session end
await supabase.from('user_sessions').update({
  session_end: new Date(),
  duration_minutes: calculateDuration(),
  is_active: false
}).eq('id', sessionId);
```

#### Page View Tracking
```javascript
// On page navigation
await supabase.from('user_page_views').insert({
  user_id: currentUser.id,
  page_path: window.location.pathname,
  page_title: document.title,
  referrer: document.referrer,
  device_type: detectDeviceType(),
  browser: detectBrowser(),
  ip_address: getClientIP()
});
```

#### Feature Usage Tracking
```javascript
// When user starts an essay
await supabase.from('user_feature_usage').insert({
  user_id: currentUser.id,
  feature_name: 'essay_writing',
  action: 'start',
  metadata: { task_type: 'task1' }
});

// When user completes an essay
await supabase.from('user_feature_usage').insert({
  user_id: currentUser.id,
  feature_name: 'essay_writing',
  action: 'complete',
  metadata: {
    band_score: calculatedBand,
    time_taken: timeSpent,
    word_count: essayLength
  }
});
```

#### Progress Tracking
```javascript
// Update user progress after test completion
await supabase.from('user_progress').upsert({
  user_id: currentUser.id,
  skill_area: 'writing',
  tests_completed: currentTests + 1,
  average_score: newAverageScore,
  improvement_rate: calculateImprovement(),
  last_activity: new Date()
});
```

## Key Insights for Product Launch

### User Acquisition
- Track which marketing channels drive the most signups
- Monitor conversion from free trials to paid users
- Identify optimal user onboarding flow

### Engagement Metrics
- Measure feature adoption rates
- Track user progression through skill levels
- Identify drop-off points in user journey

### Revenue Optimization
- Calculate customer acquisition cost (CAC)
- Monitor lifetime value (LTV) trends
- Optimize pricing based on feature usage

### Product Improvement
- Use feedback analytics to prioritize features
- Track performance improvements over time
- Identify popular vs. underutilized features

## Access Dashboard

1. Navigate to `http://localhost:3000`
2. Login with: `admin` / `adminielts123`
3. View comprehensive analytics on the dashboard

## Next Steps for Launch

1. **Implement Tracking**: Add the tracking code to your main application
2. **Set Up Alerts**: Create alerts for key metric changes
3. **A/B Testing**: Use analytics to measure feature impact
4. **User Segmentation**: Create user cohorts for targeted analysis
5. **Predictive Analytics**: Use historical data for growth forecasting

This analytics system provides the foundation for data-driven product development and successful platform launch.
