#' design_wind_speed
#'
#' This function calculates design wind speed as a function of location, lifespan, build year, and Risk Category.
#' @param FIPS US County FIPS code
#' @param lifespan design lifespan in years
#' @param buildYear year of construction
#' @param riskCat ASCE Risk Category, accepts values between 1 and 4
#' @param method method of calculating design wind speed, either "LEP" or "MRI"
#' @export

design_wind_speed <- function(FIPS, lifespan, buildYear, riskCat, method){
  if (which(fit_data$county_fips == FIPS) == FALSE) stop('Invalid FIPS Code or No Data at Location')
  countyData = fit_data[which(fit_data$county_fips == FIPS),]
  if (riskCat < 1 | riskCat > 4) stop('Risk Category must be between 1 and 4')
  past_i = 1984 # first year of past climate
  past_m = 2000 # middle year of past climate
  past_f = 2015 # last year of past climate
  future_i = 2070 # first year of future climate
  future_f = 2100 # last year of future climate
  if (buildYear < past_m) warning('stationary climate assumed for years before 2000')
  past = c(countyData$Scale_Past[1], countyData$Shape_Past[1])
  future = c(countyData$Scale_Future[1], countyData$Shape_Future[1])
  GPD_past = countyData$GPD_Fit_Past[1]
  GPD_future = countyData$GPD_Fit_Future[1]
  u_past = GPD_past[[1]][["threshold"]]
  u_future = GPD_future[[1]][["threshold"]]
  lambda_past = GPD_past[[1]][["npp"]]*GPD_past[[1]][["pat"]]
  lambda_future = countyData$Freq[1]*GPD_future[[1]][["pat"]]
  if (method == "LEP") {
    year = seq(from = buildYear, by = 1, length.out = lifespan)
    if (any(year > future_f)) warning('stationary climate assumed for years after 2100')
    coeff_p = (future_f - year)/(future_f - past_m)
    coeff_f = (year - past_m)/(future_f - past_m)
    for (i in 1:lifespan) {
      if (year[i] <= past_m) {
        coeff_p[i] = 1
        coeff_f[i] = 0
      }
      if (year[i] >= future_f) {
        coeff_p[i] = 0
        coeff_f[i] = 1
      }
    }
    sigma = coeff_p*past[1] + coeff_f*future[1]
    xi = coeff_p*past[2] + coeff_f*future[2]
    u = coeff_p*u_past + coeff_f*u_future

    lambda = coeff_p*lambda_past + coeff_f*lambda_future
    ASCE = c(300,700,1700,3000)
    lifetime_ASCE = 50
    MRI = ASCE[riskCat]
    LEP = 1-(1-1/MRI)^lifetime_ASCE
    xd = nonstationary_return(LEP, countyData$Latitude, countyData$Longitude, sigma, xi, u, lambda,
            c(countyData$NTC_1, countyData$NTC_2))
  }
  if (method == "MRI") {
    year = c(buildYear,buildYear+lifespan-1)
    if (any(year > future_f)) warning('stationary climate assumed for years after 2100')
    coeff_p = (future_f - year)/(future_f - past_m)
    coeff_f = (year - past_m)/(future_f - past_m)
    for (i in 1:2) {
      if (year[i] <= past_m) {
        coeff_p[i] = 1
        coeff_f[i] = 0
      }
      if (year[i] >= future_f) {
        coeff_p[i] = 0
        coeff_f[i] = 1
      }
    }
    sigma = coeff_p*past[1] + coeff_f*future[1]
    xi = coeff_p*past[2] + coeff_f*future[2]
    u = coeff_p*u_past + coeff_f*u_future

    lambda = coeff_p*lambda_past + coeff_f*lambda_future
    ASCE = c(300,700,1700,3000)
    N = ASCE[riskCat]
    xd = nonstationary_return_MRI(N, countyData$Latitude, countyData$Longitude, sigma, xi, u, lambda,
                c(countyData$NTC_1, countyData$NTC_2))
  }
  if (!exists("xd"))
    stop('Method must be either "LEP" or "MRI"')
  return(xd)
}
