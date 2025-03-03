;; FitForge - Decentralized Fitness Tracking Platform

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-found (err u404))
(define-constant err-unauthorized (err u401)) 
(define-constant err-already-exists (err u409))
(define-constant err-invalid-input (err u400))
(define-constant max-streak-days u7)
(define-constant blocks-per-day u144) ;; Assuming 10-minute blocks
(define-constant max-workout-duration u360) ;; 6 hours in minutes

;; Helper Functions
(define-private (block-to-days (block-height uint))
  (/ block-height blocks-per-day)
)

(define-private (is-same-day (block1 uint) (block2 uint))
  (is-eq (block-to-days block1) (block-to-days block2))
)

(define-private (validate-workout-input (duration uint) (workout-type (string-utf8 64)) (notes (string-utf8 256)))
  (if (> duration max-workout-duration)
    err-invalid-input
    (if (is-eq (len workout-type) u0)
      err-invalid-input
      (ok true)))
)

;; [Previous map definitions remain unchanged]

(define-public (log-workout (workout-type (string-utf8 64)) (duration uint) (notes (string-utf8 256)))
  (let
    (
      (workout-id (+ (var-get workout-counter) u1))
      (user-data (unwrap! (get-user-data tx-sender) err-not-found))
      (last-workout-height (get last-workout user-data))
      (current-streak (get current-streak user-data))
      (today-days (block-to-days block-height))
      (last-workout-days (block-to-days last-workout-height))
    )
    ;; Validate input
    (try! (validate-workout-input duration workout-type notes))
    
    ;; Calculate new streak
    (let
      ((new-streak (if (is-eq last-workout-height u0)
                    u1
                    (if (and (not (is-same-day block-height last-workout-height))
                            (is-eq (- today-days last-workout-days) u1))
                      (+ current-streak u1)
                      (if (is-same-day block-height last-workout-height)
                        current-streak
                        u1))))
       (new-level (calculate-new-level (+ (get total-workouts user-data) u1))))
      
      (try! (map-set Workouts workout-id {
        user: tx-sender,
        workout-type: workout-type,
        duration: duration,
        timestamp: block-height,
        notes: notes
      }))
      (var-set workout-counter workout-id)
      (map-set Users tx-sender (merge user-data {
        total-workouts: (+ (get total-workouts user-data) u1),
        current-streak: new-streak,
        last-workout: block-height,
        level: new-level
      }))
      (try! (check-achievements tx-sender))
      (ok workout-id))
  )
)

;; [Remaining contract functions unchanged]
