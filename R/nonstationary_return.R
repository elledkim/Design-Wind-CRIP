nonstationary_return <- function(LEP,lat,long,sigma,xi,u,lambda,NTC_coeff){
  m = length(sigma)
  test_value = ceiling(max(u))
  p = 1
  while (p>LEP) {
      p_TC = prod(exp(-lambda*(1+xi/sigma*(test_value-u))^(-1/xi)), na.rm = TRUE)
      p_NTC = (exp(-exp(-(test_value-NTC_coeff[1])/NTC_coeff[2])))^m
      p = 1-p_NTC*p_TC
      if (p < 0) {
        p = 1
      }
      test_value = test_value + 1
  }
  xd = test_value - 1
  return(xd)
}
