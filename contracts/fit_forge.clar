;; FitForge - Decentralized Fitness Tracking Platform

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-found (err u404))
(define-constant err-unauthorized (err u401))

;; Data Maps
(define-map Users principal 
  {
    goals: (string-utf8 256),
    level: uint,
    total-workouts: uint,
    joined-at: uint
  }
)

(define-map Workouts uint 
  {
    user: principal,
    workout-type: (string-utf8 64),
    duration: uint,
    timestamp: uint,
    notes: (string-utf8 256)
  }
)

(define-map Achievements principal 
  {
    milestones: (list 10 (string-utf8 64)),
    badges: (list 10 (string-utf8 64))
  }
)

;; Data Variables
(define-data-var workout-counter uint u0)

;; Public Functions
(define-public (create-profile (goals (string-utf8 256)))
  (let
    ((user tx-sender))
    (ok (map-set Users user {
      goals: goals,
      level: u1,
      total-workouts: u0,
      joined-at: block-height
    }))
  )
)

(define-public (log-workout (workout-type (string-utf8 64)) (duration uint) (notes (string-utf8 256)))
  (let
    (
      (workout-id (+ (var-get workout-counter) u1))
      (user-data (unwrap! (get-user-data tx-sender) err-not-found))
    )
    (try! (map-set Workouts workout-id {
      user: tx-sender,
      workout-type: workout-type,
      duration: duration,
      timestamp: block-height,
      notes: notes
    }))
    (var-set workout-counter workout-id)
    (map-set Users tx-sender (merge user-data {
      total-workouts: (+ (get total-workouts user-data) u1)
    }))
    (try! (check-achievements tx-sender))
    (ok workout-id)
  )
)

(define-public (update-goals (new-goals (string-utf8 256)))
  (let
    ((user-data (unwrap! (get-user-data tx-sender) err-not-found)))
    (ok (map-set Users tx-sender (merge user-data {goals: new-goals})))
  )
)

;; Private Functions
(define-private (check-achievements (user principal))
  (let
    ((user-data (unwrap! (get-user-data user) err-not-found))
     (total-workouts (get total-workouts user-data)))
    (match (get-achievements user)
      achievement-data (begin
        (if (and (is-eq (mod total-workouts u10) u0) 
                 (> total-workouts u0))
          (try! (add-achievement user (concat "Completed " (to-string total-workouts) " workouts!")))
          (ok true)
        ))
      err-not-found
    )
  )
)

(define-private (add-achievement (user principal) (achievement (string-utf8 64)))
  (let
    ((current-achievements (default-to {milestones: (list), badges: (list)} (map-get? Achievements user))))
    (ok (map-set Achievements user 
      (merge current-achievements {
        milestones: (unwrap! (as-max-len? (append (get milestones current-achievements) achievement) u10) err-unauthorized)
      })
    ))
  )
)

;; Read Only Functions
(define-read-only (get-user-data (user principal))
  (ok (unwrap! (map-get? Users user) err-not-found))
)

(define-read-only (get-workout (workout-id uint))
  (ok (unwrap! (map-get? Workouts workout-id) err-not-found))
)

(define-read-only (get-achievements (user principal))
  (ok (unwrap! (map-get? Achievements user) err-not-found))
)